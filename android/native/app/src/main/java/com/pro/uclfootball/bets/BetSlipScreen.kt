package com.pro.uclfootball.bets

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.compose.runtime.*
import androidx.compose.material3.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.Modifier
import androidx.compose.ui.Alignment
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.serialization.json.*
import com.pro.uclfootball.match.marketValue
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
    val requiresSignIn: Boolean = false, val match: MatchDetailDto? = null, val account: MeResponse? = null)

class BetSlipViewModel(private val api: NativeApiClient, private val sessions: AuthSessionRepository,
    private val matchId: String, private val market: String) : ViewModel() {
    private val mutableState = MutableStateFlow(BetSlipState())
    val state = mutableState.asStateFlow()
    init {
        viewModelScope.launch {
            try {
                val (match, account) = coroutineScope {
                    val match = async { api.getJson<MatchResponse>("api/mobile/match?id=${encode(matchId)}") }
                    val account = async { api.getJson<MeResponse>("api/me", true) }
                    match.await().match to account.await()
                }
                mutableState.update { it.copy(match = match, account = account) }
            } catch (e: CancellationException) { throw e }
            catch (e: ApiException) { mutableState.update { it.copy(requiresSignIn = e.httpStatus == 401, error = R.string.journey_submission_failed) } }
            catch (_: Exception) { mutableState.update { it.copy(error = R.string.journey_offline) } }
        }
    }
    fun stake(value: String) {
        if (state.value.busy || state.value.uncertain || state.value.result != null) return
        mutableState.update { it.copy(stake = value, quote = null, error = null, attempt = UUID.randomUUID().toString()) }
    }
    fun invalidateQuote() { mutableState.update { it.copy(quote = null) } }
    fun quote() = work(false) {
        val current = state.value
        if (current.stake.toBigDecimalOrNull()?.signum() != 1) return@work fail(R.string.journey_valid_amount)
        val quote = api.getJson<BetQuoteDto>("api/mobile/bet-quote?match_id=${encode(matchId)}&picked=${encode(market)}&stake=${encode(current.stake)}", true)
        mutableState.update { it.copy(quote = quote) }
    }
    fun submit() = work(true) {
        val current = state.value
        if (current.uncertain || current.result != null) return@work fail(R.string.journey_uncertain)
        if (current.stake.toBigDecimalOrNull()?.signum() != 1) return@work fail(R.string.journey_valid_amount)
        val quote = try { current.quote ?: api.getJson<BetQuoteDto>("api/mobile/bet-quote?match_id=${encode(matchId)}&picked=${encode(market)}&stake=${encode(current.stake)}", true) }
        catch (_: IOException) { return@work fail(R.string.journey_offline) }
        mutableState.update { it.copy(quote = quote) }
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

@OptIn(ExperimentalMaterial3Api::class)
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
    LaunchedEffect(state.result) { if (state.result != null) onBets() }
    val match = state.match
    val level = runCatching { state.account?.vip?.jsonObject?.get("viplevel")?.jsonPrimitive?.intOrNull }.getOrNull() ?: 1
    val base = match?.marketValue(market)?.toDouble() ?: 0.0
    val odd = state.quote?.odd ?: base * (1 + listOf(0.0,0.0,.10,.20,.33,.47,.63,.83).getOrElse(level) { 0.0 })
    val stake = state.stake.toDoubleOrNull() ?: 0.0
    val profit = state.quote?.profit.textValue().toDoubleOrNull() ?: stake * odd / 100
    val sheet = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    ModalBottomSheet(onDismissRequest = onBack, sheetState = sheet, containerColor = UclColors.paper, shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp), dragHandle = null) {
        Column(Modifier.fillMaxWidth().heightIn(max = 720.dp).verticalScroll(rememberScrollState()).padding(start = 16.dp, top = 20.dp, end = 16.dp, bottom = 24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            WebPageHeading(webCopy("mobile.match.placeBet"), onBack, bordered = true)
            JourneyFeedback(state.error)
            if (state.uncertain) { Text(stringResource(R.string.journey_uncertain)); JourneyAction(webCopy("common.myBets"), onClick = onBets); return@Column }
            if (state.result != null) return@Column
            Text((if (match?.league == "others") match.otherl else match?.league).orEmpty(), Modifier.fillMaxWidth(), fontSize = 12.sp, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
            WebPanel(padding = 12) {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Column(Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally) { WebRemoteImage(match?.ihome.textValue(), Modifier.size(50.dp)); Text(match?.home.orEmpty(), fontSize = 12.sp, textAlign = androidx.compose.ui.text.style.TextAlign.Center) }
                    Text(listOfNotNull(match?.time, match?.date).joinToString(" | "), Modifier.weight(1f), fontSize = 14.sp, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                    Column(Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally) { WebRemoteImage(match?.iaway.textValue(), Modifier.size(50.dp)); Text(match?.away.orEmpty(), fontSize = 12.sp, textAlign = androidx.compose.ui.text.style.TextAlign.Center) }
                }
            }
            HorizontalDivider(color = UclColors.dashboardLine)
            listOf(webCopy("mobile.match.matchId") to matchId, webCopy("mobile.match.choose") to (state.quote?.market ?: marketLabel(market)),
                webCopy("landing.live.odds") to String.format(java.util.Locale.ROOT, "%.3f%%", odd), webCopy("common.balance") to webMoney(state.account?.profile?.balance.textValue().toDoubleOrNull() ?: 0.0)).forEach { (label, value) ->
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Text(label, fontSize = 16.sp, fontWeight = FontWeight.Bold); Text(value, fontSize = 16.sp, fontWeight = FontWeight.Bold) }
            }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text(webCopy("mobile.match.stakeAmount"), fontSize = 14.sp)
                TextButton(onClick = { vm.stake(state.account?.profile?.balance.textValue()) }, enabled = !state.busy) { Text(webCopy("mobile.match.useAllBalance")) }
            }
            OutlinedTextField(state.stake, vm::stake, modifier = Modifier.fillMaxWidth(), singleLine = true, enabled = !state.busy, keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = KeyboardType.Decimal), shape = RoundedCornerShape(8.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Text(webCopy("mobile.match.profit")); Text(webMoney(profit), fontWeight = FontWeight.Bold) }
            JourneyAction(webCopy("mobile.match.placeBet"), enabled = stake > 0 && odd > 0, busy = state.busy, onClick = vm::submit)
        }
    }
}

private fun marketLabel(key: String): String = mapOf("nilnil" to "0 - 0", "onenil" to "1 - 0", "nilone" to "0 - 1", "oneone" to "1 - 1", "twonil" to "2 - 0", "niltwo" to "0 - 2", "twoone" to "2 - 1", "onetwo" to "1 - 2", "twotwo" to "2 - 2", "threenil" to "3 - 0", "nilthree" to "0 - 3", "threeone" to "3 - 1", "onethree" to "1 - 3", "twothree" to "2 - 3", "threetwo" to "3 - 2", "threethree" to "3 - 3")[key] ?: "Other"
