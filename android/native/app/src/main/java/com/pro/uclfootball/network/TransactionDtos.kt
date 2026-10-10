package com.pro.uclfootball.network

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

/** Read-only response shapes for GET /api/my-transactions. */
@Serializable
data class MyTransactionsResponse(
    val status: String? = null,
    val transactions: List<TransactionDto> = emptyList(),
    val data: List<TransactionDto> = emptyList(),
    val summary: TransactionSummaryDto? = null,
)

@Serializable
data class TransactionSummaryDto(
    val totalDepositsMmk: JsonElement? = null,
    val totalWithdrawalsMmk: JsonElement? = null,
    val count: Int? = null,
)

@Serializable
data class TransactionDto(
    val id: String? = null,
    val type: String? = null,
    val status: String? = null,
    val statusLabel: String? = null,
    val statusKey: String? = null,
    val hideStatusTag: Boolean? = null,
    val methodCode: String? = null,
    val methodLabel: String? = null,
    val primaryAmount: TransactionAmountDto? = null,
    val secondaryAmount: TransactionAmountDto? = null,
    val conversionNote: String? = null,
    val conversionNoteKey: String? = null,
    val conversionNoteValues: JsonElement? = null,
    val timestamp: String? = null,
    val title: String? = null,
    val titleKey: String? = null,
    val detail: String? = null,
    val detailKey: String? = null,
    val detailValues: JsonElement? = null,
    val detailParts: List<TransactionDetailPartDto> = emptyList(),
)

@Serializable
data class TransactionAmountDto(
    val value: JsonElement? = null,
    val currency: String? = null,
    val label: String? = null,
    val labelKey: String? = null,
    val approximate: Boolean? = null,
)

@Serializable
data class TransactionDetailPartDto(
    val labelKey: String? = null,
    val label: String? = null,
    val value: String? = null,
)
