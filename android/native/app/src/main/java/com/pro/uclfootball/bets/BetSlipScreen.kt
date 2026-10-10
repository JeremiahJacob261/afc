package com.pro.uclfootball.bets

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.compose.runtime.*
import androidx.compose.material3.Text
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.KeyboardType
import com.pro.uclfootball.R
import com.pro.uclfootball.UclAppContainer
import com.pro.uclfootball.auth.AuthSessionRepository
import com.pro.uclfootball.network.*
import com.pro.uclfootball.ui.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.SerialName
import kotlinx.serialization.json.JsonElement
import java.io.IOException
import java.net.URLEncoder
import java.util.UUID

@Serializable data class BetQuoteDto(val status: String, val odd: Double, val balance: JsonElement,
    val profit: JsonElement, val market: String, val home: String, val away: String)
@Serializable data class PlaceBetRequest(@SerialName("match_id") val matchId: String, val picked: String,
    val stake: String, @SerialName("client_bet_id") val clientBetId: String, @SerialName("expected_odd") val expectedOdd: Double)
@Serializable data class PlacedBetResult(val status: String? = null, val betid: JsonElement? = null,
    val odd: JsonElement? = null, val profit: JsonElement? = null, val balance: JsonElement? = null)

data class BetSlipState(val stake: String = "", val quote: BetQuoteDto? = null, val busy: Boolean = false,
    val error: Int? = null, val result: PlacedBetResult? = null, val attempt: String = UUID.randomUUID().toString(), val uncertain: Boolean = false,
    val requiresSignIn: Boolean = false)

class BetSlipViewModel(private val api: NativeApiClient, private val sessions: AuthSessionRepository,
    private val matchId: String, private val market: String) : ViewModel() {
    private val mutableState = MutableStateFlow(BetSlipState())
    val state = mutableState.asStateFlow()
    fun stake(value: String) {
        if (state.value.busy || state.value.uncertain || state.value.result != null) return
        mutableState.update { it.copy(stake = value, quote = null, error = null, attempt = UUID.randomUUID().toString()) }
    }
    fun invalidateQuote() { mutableState.update { it.copy(quote = null) } }
    fun quote() = work(false) {
        val current = state.value
        if (current.stake.toBigDecimalOrNull()?.signum() != 1) return@work fail(R.string.journey_valid_amount)
        if (!NativeJourneyGates.betting) return@work fail(R.string.journey_unavailable)
        val quote = api.getJson<BetQuoteDto>("api/mobile/bet-quote?match_id=${encode(matchId)}&picked=${encode(market)}&stake=${encode(current.stake)}", true)
        mutableState.update { it.copy(quote = quote) }
    }
    fun submit() = work(true) {
        if (!NativeJourneyGates.betting) return@work fail(R.string.journey_unavailable)
        val current = state.value
        if (current.uncertain || current.result != null) return@work fail(R.string.journey_uncertain)
        val quote = current.quote ?: return@work fail(R.string.journey_data_changed)
        val result = api.postJson<PlaceBetRequest, PlacedBetResult>("api/place-bet", PlaceBetRequest(matchId, market, current.stake, current.attempt, quote.odd), true)
        check(result.betid.textValue().isNotBlank())
        mutableState.update { it.copy(result = result) }
    }
    private fun fail(resource: Int) { mutableState.update { it.copy(error = resource) } }
    private fun encode(value: String) = URLEncoder.encode(value, "UTF-8")
    private fun work(mutation: Boolean, block: suspend () -> Unit) {
        if (state.value.busy) return
        mutableState.update { it.copy(busy = true, error = null) }
        viewModelScope.launch {
            try { block() }
            catch (error: CancellationException) { throw error }
            catch (error: ApiException) {
                if (error.httpStatus == 401) {
                    sessions.clear()
                    mutableState.update { it.copy(quote = null, requiresSignIn = true) }
                    return@launch
                }
                mutableState.update { it.copy(quote = null, error = if (error.httpStatus == 409) R.string.bet_slip_odds_changed else R.string.journey_submission_failed) }
            }
            catch (error: IOException) { mutableState.update { it.copy(uncertain = it.uncertain || mutation, error = if (mutation) R.string.journey_uncertain else R.string.journey_offline) } }
            catch (error: Exception) { mutableState.update { it.copy(uncertain = it.uncertain || mutation, error = R.string.journey_submission_failed) } }
            finally { mutableState.update { it.copy(busy = false) } }
        }
    }
}

@Composable
fun BetSlipRoute(container: UclAppContainer, matchId: String, market: String, onBack: () -> Unit,
    onBets: () -> Unit, onBet: (String) -> Unit, onSignInRequired: () -> Unit) {
    val vm: BetSlipViewModel = viewModel(factory = remember(container, matchId, market) {
        object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST") override fun <T : ViewModel> create(modelClass: Class<T>): T = BetSlipViewModel(container.apiClient, container.authSessionRepository, matchId, market) as T
        }
    })
    val state by vm.state.collectAsStateWithLifecycle()
    RefreshOnResume(vm::invalidateQuote)
    LaunchedEffect(state.requiresSignIn) { if (state.requiresSignIn) onSignInRequired() }
    JourneyPage(stringResource(R.string.bet_slip_title), onBack) {
        JourneyFeedback(state.error)
        if (state.result != null) {
            Text(stringResource(R.string.bet_slip_success))
            state.result?.let { result ->
                JourneyFact(stringResource(R.string.bet_slip_accepted_odd), result.odd.textValue())
                JourneyAction(stringResource(R.string.bet_slip_view_bet)) { onBet(result.betid.textValue()) }
            }
            JourneyAction(stringResource(R.string.bets_title), onClick = onBets)
            return@JourneyPage
        }
        if (state.uncertain) {
            Text(stringResource(R.string.journey_uncertain))
            JourneyAction(stringResource(R.string.bets_title), onClick = onBets)
            return@JourneyPage
        }
        JourneyField(stringResource(R.string.bet_slip_stake), state.stake, vm::stake, KeyboardType.Decimal, enabled = !state.busy)
        Text(stringResource(R.string.bet_slip_server_quote))
        JourneyAction(stringResource(R.string.bet_slip_review), busy = state.busy, onClick = vm::quote)
        state.quote?.let { quote ->
            JourneyFact("${quote.home} · ${quote.away}", quote.market)
            JourneyFact(stringResource(R.string.bet_slip_accepted_odd), quote.odd.toString())
            JourneyFact(stringResource(R.string.account_balance), "${quote.balance.textValue()} MMK")
            JourneyFact(stringResource(R.string.bet_slip_profit), "${quote.profit.textValue()} MMK")
            JourneyAction(stringResource(R.string.bet_slip_confirm), busy = state.busy, onClick = vm::submit)
        }
    }
}
