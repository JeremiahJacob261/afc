package com.pro.uclfootball.transactions

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.pro.uclfootball.BuildConfig
import com.pro.uclfootball.R
import com.pro.uclfootball.UclAppContainer
import com.pro.uclfootball.home.NativeBottomBar
import com.pro.uclfootball.network.TransactionAmountDto
import com.pro.uclfootball.network.TransactionDto
import com.pro.uclfootball.ui.UclColors
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonPrimitive

private enum class TransactionFilter { All, Deposits, Withdrawals }

@Composable
fun TransactionsRoute(
    container: UclAppContainer,
    onBack: () -> Unit,
    onSelectTab: (String) -> Unit,
    onSignInRequired: () -> Unit,
) {
    val viewModel: TransactionsViewModel = viewModel(
        factory = remember(container.transactionsRepository, container.authSessionRepository) {
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T =
                    TransactionsViewModel(container.transactionsRepository, container.authSessionRepository) as T
            }
        },
    )
    val state by viewModel.state.collectAsStateWithLifecycle()
    com.pro.uclfootball.ui.RefreshOnResume(viewModel::refresh)
    LaunchedEffect(state.requiresSignIn) { if (state.requiresSignIn) onSignInRequired() }
    var selected by rememberSaveable { mutableStateOf(TransactionFilter.All) }
    val filtered = state.transactions.filter { transaction ->
        when (selected) {
            TransactionFilter.All -> true
            TransactionFilter.Deposits -> transaction.type == "deposit"
            TransactionFilter.Withdrawals -> transaction.type == "withdraw"
        }
    }
    val depositCount = state.transactions.count { it.type == "deposit" }
    val withdrawalCount = state.transactions.count { it.type == "withdraw" }

    Scaffold(
        contentWindowInsets = WindowInsets.statusBars,
        containerColor = UclColors.paper,
        bottomBar = { NativeBottomBar("account", onSelectTab) },
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(start = 16.dp, top = 16.dp, end = 16.dp, bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item {
                TextButton(onClick = onBack, contentPadding = PaddingValues(horizontal = 0.dp, vertical = 4.dp)) {
                    Text(stringResource(R.string.transactions_back), color = UclColors.ink)
                }
            }
            item {
                Text(stringResource(R.string.transactions_title), color = UclColors.ink, fontFamily = FontFamily.Serif, fontSize = 32.sp)
            }
            item {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        color = Color.White,
                        border = BorderStroke(1.dp, Color(0x3D1BB6FF)),
                    ) {
                        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                            Text(stringResource(R.string.transactions_history), color = UclColors.ink, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                            Text(stringResource(R.string.transactions_count, state.transactions.size), color = UclColors.muted, fontSize = 12.sp)
                        }
                    }
                    if (!state.isLoading && state.error == null) {
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            TransactionTotal(stringResource(R.string.transactions_total_deposits), state.summary?.totalDepositsMmk, Modifier.weight(1f))
                            TransactionTotal(stringResource(R.string.transactions_total_withdrawals), state.summary?.totalWithdrawalsMmk, Modifier.weight(1f))
                        }
                    }
                }
            }
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterButton(stringResource(R.string.transactions_filter_all), state.transactions.size, selected == TransactionFilter.All, Modifier.weight(1f)) { selected = TransactionFilter.All }
                    FilterButton(stringResource(R.string.transactions_filter_deposits), depositCount, selected == TransactionFilter.Deposits, Modifier.weight(1f)) { selected = TransactionFilter.Deposits }
                    FilterButton(stringResource(R.string.transactions_filter_withdrawals), withdrawalCount, selected == TransactionFilter.Withdrawals, Modifier.weight(1f)) { selected = TransactionFilter.Withdrawals }
                }
            }
            when {
                state.isLoading -> item { TransactionMessage(stringResource(R.string.transactions_loading)) }
                state.error != null -> item {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                        TransactionMessage(stringResource(if (state.error == TransactionsError.Network) R.string.transactions_error_network else R.string.transactions_error_general))
                        TextButton(onClick = viewModel::refresh) { Text(stringResource(R.string.common_retry), color = UclColors.accent) }
                    }
                }
                filtered.isEmpty() -> item {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                        TransactionMessage(stringResource(R.string.transactions_empty_title))
                        Text(
                            stringResource(
                                when (selected) {
                                    TransactionFilter.All -> R.string.transactions_empty_all
                                    TransactionFilter.Deposits -> R.string.transactions_empty_deposits
                                    TransactionFilter.Withdrawals -> R.string.transactions_empty_withdrawals
                                },
                            ),
                            color = UclColors.muted,
                            fontSize = 13.sp,
                        )
                    }
                }
                else -> items(filtered, key = { it.id ?: "${it.type}-${it.timestamp}-${it.hashCode()}" }) { transaction ->
                    TransactionCard(transaction)
                }
            }
        }
    }
}

@Composable
private fun TransactionTotal(label: String, raw: kotlinx.serialization.json.JsonElement?, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        color = Color.White,
        border = BorderStroke(1.dp, UclColors.dashboardLine),
    ) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
            Text(label, color = UclColors.muted, fontSize = 12.sp)
            val value = scalar(raw)
            val display = when {
                value == null -> stringResource(R.string.transactions_amount_unavailable)
                BuildConfig.CURRENCY_LABEL.isBlank() -> stringResource(R.string.transactions_currency_pending)
                else -> "$value ${BuildConfig.CURRENCY_LABEL}"
            }
            Text(display, color = UclColors.ink, fontSize = 16.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun FilterButton(label: String, count: Int, selected: Boolean, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Button(
        onClick = onClick,
        modifier = modifier.height(44.dp),
        contentPadding = PaddingValues(horizontal = 4.dp, vertical = 8.dp),
        shape = RoundedCornerShape(12.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = if (selected) UclColors.accent else Color.White,
            contentColor = if (selected) Color.White else UclColors.ink,
        ),
        border = if (selected) null else BorderStroke(1.dp, UclColors.dashboardLine),
    ) { Text("$label · $count", fontSize = 11.sp, fontWeight = FontWeight.Bold, maxLines = 1) }
}

@Composable
private fun TransactionCard(item: TransactionDto) {
    val deposit = item.type == "deposit"
    val accent = if (deposit) UclColors.accent else Color(0xFFA43D4A)
    val status = when (item.status) {
        "success" -> R.string.transactions_status_success
        "failed" -> R.string.transactions_status_failed
        "processing" -> R.string.transactions_status_processing
        else -> R.string.transactions_status_pending
    }
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, accent.copy(alpha = 0.24f)),
    ) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                Surface(shape = RoundedCornerShape(12.dp), color = accent.copy(alpha = 0.10f)) {
                    Box(Modifier.size(42.dp), contentAlignment = Alignment.Center) {
                        Box(Modifier.size(12.dp).background(accent, CircleShape))
                    }
                }
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(
                        stringResource(if (deposit) R.string.transactions_deposit else R.string.transactions_withdrawal),
                        color = UclColors.ink,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(item.methodLabel ?: item.methodCode?.uppercase().orEmpty(), color = UclColors.muted, fontSize = 12.sp)
                }
                if (item.hideStatusTag != true) {
                    Surface(shape = RoundedCornerShape(20.dp), color = accent.copy(alpha = 0.10f)) {
                        Text(stringResource(status), color = accent, modifier = Modifier.padding(horizontal = 9.dp, vertical = 6.dp), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
            Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(amountLabel(item.primaryAmount), color = UclColors.muted, fontSize = 11.sp)
                Text(formatAmount(item.primaryAmount), color = UclColors.ink, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                item.secondaryAmount?.let { secondary ->
                    Text("${amountLabel(secondary)}: ${formatAmount(secondary)}", color = UclColors.muted, fontSize = 12.sp)
                }
                item.conversionNote?.takeIf(String::isNotBlank)?.let {
                    Text(stringResource(R.string.transactions_conversion_unavailable), color = Color(0xFF8A6013), fontSize = 12.sp)
                }
            }
            val defaultDetailLabel = stringResource(R.string.transactions_detail)
            val details = item.detailParts.mapNotNull { part ->
                val value = part.value?.takeIf(String::isNotBlank) ?: return@mapNotNull null
                "${part.label ?: defaultDetailLabel}: $value"
            }.joinToString(" · ").ifBlank { item.detail.orEmpty() }
            if (details.isNotBlank() || !item.timestamp.isNullOrBlank()) {
                Spacer(Modifier.fillMaxWidth().height(1.dp).background(UclColors.dashboardLine))
                if (details.isNotBlank()) Text(details, color = UclColors.muted, fontSize = 12.sp)
                item.timestamp?.takeIf(String::isNotBlank)?.let { Text(it, color = UclColors.muted, fontSize = 11.sp) }
            }
        }
    }
}

@Composable
private fun amountLabel(amount: TransactionAmountDto?): String =
    amount?.label?.takeIf(String::isNotBlank) ?: stringResource(R.string.transactions_amount_label)

@Composable
private fun formatAmount(amount: TransactionAmountDto?): String {
    val value = scalar(amount?.value) ?: return stringResource(R.string.transactions_amount_unavailable)
    if (BuildConfig.CURRENCY_LABEL.isBlank()) return stringResource(R.string.transactions_currency_pending)
    val currency = amount?.currency?.uppercase().orEmpty()
    if (currency != "MMK" || BuildConfig.CURRENCY_LABEL != "MMK") return stringResource(R.string.transactions_currency_pending)
    val label = BuildConfig.CURRENCY_LABEL
    val prefix = if (amount?.approximate == true) "~ " else ""
    return "$prefix$value $label"
}

private fun scalar(value: kotlinx.serialization.json.JsonElement?): String? =
    value?.let { runCatching { it.jsonPrimitive.contentOrNull }.getOrNull() }?.takeIf(String::isNotBlank)

@Composable
private fun TransactionMessage(message: String) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        color = Color.White,
        border = BorderStroke(1.dp, UclColors.dashboardLine),
    ) { Text(message, modifier = Modifier.padding(20.dp), color = UclColors.muted) }
}
