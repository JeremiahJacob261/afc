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
import androidx.compose.material3.HorizontalDivider
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
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.widthIn
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
import com.pro.uclfootball.ui.*
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
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
        contentWindowInsets = com.pro.uclfootball.ui.UserContentInsets,
        containerColor = androidx.compose.ui.graphics.Color.Transparent,
        bottomBar = { NativeBottomBar("account", onSelectTab) },
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(start = 16.dp, top = 16.dp, end = 16.dp, bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item { WebPageHeading(webCopy("mobile.transactions.title"), onBack, bordered = true) }
            item {
                Surface(Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), color = Color.White, border = BorderStroke(1.dp, Color(0x3D1BB6FF))) {
                    Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                Text(webCopy("mobile.transactions.paymentHistory"), fontSize = 18.sp, fontWeight = FontWeight.ExtraBold)
                                Text(webCopy("mobile.transactions.count", "count" to state.transactions.size), color = WebMuted, fontSize = 12.sp)
                            }
                            Box(Modifier.size(40.dp).background(Color(0x1F1BB6FF), RoundedCornerShape(12.dp)), contentAlignment = Alignment.Center) { WebIcon("solar_history_bold", Modifier.size(22.dp), UclColors.accent) }
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            TransactionTotal(webCopy("mobile.transactions.totalDeposits"), state.summary?.totalDepositsMmk, Modifier.weight(1f), true)
                            TransactionTotal(webCopy("mobile.transactions.totalWithdrawals"), state.summary?.totalWithdrawalsMmk, Modifier.weight(1f), false)
                        }
                    }
                }
            }
            item {
                Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterButton(webCopy("common.all"), state.transactions.size, selected == TransactionFilter.All, Modifier.widthIn(min = 116.dp)) { selected = TransactionFilter.All }
                    FilterButton(webCopy("mobile.transactions.deposits"), depositCount, selected == TransactionFilter.Deposits, Modifier.widthIn(min = 116.dp)) { selected = TransactionFilter.Deposits }
                    FilterButton(webCopy("mobile.transactions.withdrawals"), withdrawalCount, selected == TransactionFilter.Withdrawals, Modifier.widthIn(min = 116.dp)) { selected = TransactionFilter.Withdrawals }
                }
            }
            when {
                state.isLoading && !state.hasContent -> item {
                    Column(Modifier.fillMaxWidth().heightIn(min = 360.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp, Alignment.CenterVertically)) {
                        androidx.compose.material3.CircularProgressIndicator(Modifier.size(28.dp), color = UclColors.accent)
                        Text(webCopy("mobile.transactions.loading"), color = WebMuted, fontSize = 13.sp)
                    }
                }
                state.error != null && !state.hasContent -> item {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                        TransactionMessage(stringResource(if (state.error == TransactionsError.Network) R.string.transactions_error_network else R.string.transactions_error_general))
                        TextButton(onClick = viewModel::refresh) { Text(stringResource(R.string.common_retry), color = UclColors.accent) }
                    }
                }
                filtered.isEmpty() -> item { WebEmpty(webCopy("emptyStates.noTransactions"), if (selected == TransactionFilter.All) webCopy("mobile.transactions.emptyAll") else webCopy("mobile.transactions.emptyFiltered", "type" to webCopy(if (selected == TransactionFilter.Deposits) "common.deposit" else "common.withdraw").lowercase()), height = 320, color = UclColors.surface, icon = "solar_bill_list_bold") }
                else -> items(filtered, key = { it.id ?: "${it.type}-${it.timestamp}-${it.hashCode()}" }) { transaction ->
                    TransactionCard(transaction)
                }
            }
        }
    }
}

@Composable
private fun TransactionTotal(label: String, raw: kotlinx.serialization.json.JsonElement?, modifier: Modifier = Modifier, deposit: Boolean) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        color = Color.White,
        border = BorderStroke(1.dp, UclColors.dashboardLine),
    ) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                WebIcon(if (deposit) "solar_wallet_money_bold" else "solar_card_transfer_bold", Modifier.size(18.dp), if (deposit) UclColors.accent else Color(0xFFA43D4A))
                Text(label, color = WebMuted, fontSize = 12.sp)
            }
            Text(webMoney(scalar(raw)?.toDoubleOrNull() ?: 0.0), color = UclColors.ink, fontSize = 18.sp, fontWeight = FontWeight.ExtraBold)
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
    ) {
        WebIcon(when (label) { webCopy("common.all") -> "solar_bill_list_bold"; webCopy("mobile.transactions.deposits") -> "solar_wallet_money_bold"; else -> "solar_card_transfer_bold" }, Modifier.size(16.dp), if (selected) Color.White else WebMuted)
        Spacer(Modifier.width(6.dp)); Text("$label ($count)", fontFamily = WebInter, fontSize = 12.sp, fontWeight = FontWeight.Bold, maxLines = 1)
    }
}

@Composable
private fun TransactionCard(item: TransactionDto) {
    val deposit = item.type == "deposit"
    val accent = if (deposit) UclColors.accent else Color(0xFFA43D4A)
    val typeColor = if (deposit) Color(0xFF32D7FF) else Color(0xFFFF9E7A)
    val statusTone = when (item.status) { "success" -> UclColors.success; "failed" -> Color(0xFFA43D4A); "processing" -> Color(0xFF594596); else -> Color(0xFF8A6013) }
    val statusGround = when (item.status) { "success" -> Color(0xFFA8C7FF); "failed" -> Color(0xFFFF8CA0); "processing" -> Color(0xFFC7A6FF); else -> Color(0xFFF8C14A) }
    Surface(Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), color = Color.White, border = BorderStroke(1.dp, typeColor.copy(alpha = .28f))) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.Top) {
                Box(Modifier.size(42.dp).background(typeColor.copy(alpha = .12f), RoundedCornerShape(12.dp)), contentAlignment = Alignment.Center) {
                    WebIcon(if (deposit) "solar_wallet_money_bold" else "solar_card_transfer_bold", Modifier.size(22.dp), accent)
                }
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Row(verticalAlignment = Alignment.Top, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                            Text(item.titleKey?.takeIf(String::isNotBlank)?.let { webCopy(it) } ?: item.title ?: webCopy(if (deposit) "mobile.transactions.titleDeposit" else "mobile.transactions.titleWithdrawal"), fontSize = 15.sp, fontWeight = FontWeight.ExtraBold, lineHeight = 18.sp)
                            Text(item.methodLabel ?: item.methodCode?.uppercase() ?: webCopy("mobile.transactions.paymentMethod"), color = WebMuted, fontSize = 12.sp)
                        }
                        if (item.hideStatusTag != true) {
                            Surface(shape = RoundedCornerShape(20.dp), color = statusGround.copy(alpha = .12f), border = BorderStroke(1.dp, statusGround.copy(alpha = .28f))) {
                                Text(item.statusKey?.takeIf(String::isNotBlank)?.let { webCopy(it) } ?: item.statusLabel ?: webCopy("status.${item.status ?: "pending"}"), Modifier.padding(horizontal = 9.dp, vertical = 5.dp), color = statusTone, fontSize = 11.sp, fontWeight = FontWeight.ExtraBold)
                            }
                        }
                    }
                    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        Text(amountLabel(item.primaryAmount), color = WebMuted, fontSize = 11.sp)
                        Text(formatAmount(item.primaryAmount), fontSize = 18.sp, fontWeight = FontWeight.ExtraBold, lineHeight = 22.sp)
                        item.secondaryAmount?.let { Text("${amountLabel(it)}: ${formatAmount(it)}", color = Color(0xFFDDE7F5), fontSize = 12.sp) }
                        item.conversionNote?.takeIf(String::isNotBlank)?.let { Text(item.conversionNoteKey?.takeIf(String::isNotBlank)?.let { key -> webApiCopy(key, item.conversionNoteValues) } ?: it, color = Color(0xFF8A6013), fontSize = 12.sp) }
                    }
                }
            }
            HorizontalDivider(color = UclColors.dashboardLine)
            val details = if (item.detailParts.isNotEmpty()) item.detailParts.joinToString(" / ") { it.value.orEmpty() } else ""
            val translatedDetails = mutableListOf<String>()
            item.detailParts.forEach { part -> translatedDetails.add("${part.labelKey?.takeIf(String::isNotBlank)?.let { webCopy(it) } ?: part.label.orEmpty()}: ${part.value.orEmpty()}") }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(if (details.isNotEmpty()) translatedDetails.joinToString(" / ") else item.detailKey?.takeIf(String::isNotBlank)?.let { webApiCopy(it, item.detailValues) } ?: item.detail ?: webCopy("mobile.transactions.transactionRequest"), Modifier.weight(1f), color = WebMuted, fontSize = 12.sp, maxLines = 1, overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis)
                Text(webRecordDate(item.timestamp, webCopy("mobile.transactions.noTime")), color = WebMuted, fontSize = 11.sp)
            }
        }
    }
}

@Composable
private fun amountLabel(amount: TransactionAmountDto?): String =
    amount?.labelKey?.takeIf(String::isNotBlank)?.let { webCopy(it) } ?: amount?.label ?: webCopy("common.amount")

@Composable
private fun formatAmount(amount: TransactionAmountDto?): String {
    val value = scalar(amount?.value)?.toDoubleOrNull() ?: return webCopy("common.notAvailable")
    val currency = amount?.currency?.uppercase() ?: "MMK"
    val formatted = java.text.NumberFormat.getNumberInstance(androidx.compose.ui.platform.LocalConfiguration.current.locales[0]).apply { maximumFractionDigits = if (currency in listOf("MMK", "USDT")) 3 else 2 }.format(value)
    return (if (amount?.approximate == true) "~ " else "") + if (currency in listOf("MMK", "USDT")) "$formatted $currency" else "$currency $formatted"
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
    ) { Text(message, modifier = Modifier.padding(20.dp), color = WebMuted) }
}
