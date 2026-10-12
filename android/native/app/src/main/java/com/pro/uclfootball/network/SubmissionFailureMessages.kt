package com.pro.uclfootball.network

import com.pro.uclfootball.R

enum class SubmissionFlow { GENERAL, BET, DEPOSIT, WITHDRAWAL, WALLET, PIN }

/** Maps server-owned failure details to reviewed, localized customer copy. */
fun submissionFailureMessage(
    message: String? = null,
    code: String? = null,
    httpStatus: Int? = null,
    flow: SubmissionFlow = SubmissionFlow.GENERAL,
): Int {
    val reason = message.orEmpty().trim().lowercase()
    val errorCode = code.orEmpty().trim().lowercase()

    return when {
        errorCode == "payment_request_pending" || "pending payment request" in reason ||
            "pending deposit or withdrawal" in reason -> R.string.journey_payment_pending
        errorCode == "withdrawal_pending" || "previous withdrawal request is still pending" in reason ->
            R.string.journey_withdrawal_pending
        errorCode == "withdrawal_cooldown" || "24 hours" in reason -> R.string.journey_withdrawal_cooldown
        errorCode == "rate_changed" || "rate changed" in reason -> R.string.journey_payment_rate_changed
        flow == SubmissionFlow.WITHDRAWAL && "bets" in reason &&
            ("after your latest successful deposit" in reason || "after a successful deposit" in reason) ->
            R.string.journey_withdrawal_bet_requirement
        "receipt" in reason && "already used" in reason -> R.string.journey_receipt_used
        ("unknown or unavailable deposit method" in reason || "payment method is not available" in reason) ->
            R.string.journey_payment_method_unavailable
        "payment destination is no longer available" in reason -> R.string.journey_destination_unavailable
        "wallet already linked" in reason -> R.string.journey_wallet_already_linked
        "missing wallet details" in reason || "missing bank account details" in reason -> R.string.journey_wallet_details_missing
        "no transaction pin has been set" in reason -> R.string.journey_pin_required
        "wrong password" in reason || "wrong transaction pin" in reason -> R.string.journey_wrong_pin
        "already have a transaction pin" in reason -> R.string.journey_pin_locked
        "pin must be 4 digits" in reason -> R.string.journey_pin_invalid
        "minimum deposit" in reason -> R.string.journey_deposit_minimum_rejected
        "minimum amount to withdraw" in reason -> R.string.journey_withdrawal_minimum
        "maximum amount to withdraw" in reason -> R.string.journey_withdrawal_maximum
        "daily withdrawal limit" in reason -> R.string.journey_withdrawal_daily_limit
        "annual withdrawal limit" in reason -> R.string.journey_withdrawal_annual_limit
        "withdrawal method rate is unavailable" in reason -> R.string.journey_withdrawal_rate_unavailable
        flow == SubmissionFlow.WITHDRAWAL && (
            "temporarily unavailable" in reason || "withdrawals are disabled" in reason ||
                "withdrawals unavailable" in reason || "temporarily disabled" in reason
            ) -> R.string.journey_withdrawal_unavailable
        ("insufficient funds" in reason || "insufficient balance" in reason || "not enough mmk" in reason) && flow == SubmissionFlow.BET ->
            R.string.bet_slip_insufficient_balance
        ("insufficient funds" in reason || "insufficient balance" in reason) -> R.string.journey_insufficient_balance
        flow == SubmissionFlow.BET && ("minimum stake" in reason || "invalid bet details" in reason) ->
            R.string.bet_slip_minimum_stake
        flow == SubmissionFlow.BET && "maximum number of bets" in reason -> R.string.bet_slip_maximum_reached
        flow == SubmissionFlow.BET && "already settled" in reason -> R.string.bet_slip_match_settled
        flow == SubmissionFlow.BET && ("match not found" in reason || "match is no longer available" in reason) -> R.string.bet_slip_market_closed
        flow == SubmissionFlow.BET && "odds changed" in reason -> R.string.bet_slip_odds_changed
        flow == SubmissionFlow.BET && "market is not available" in reason -> R.string.bet_slip_market_unavailable
        flow == SubmissionFlow.BET && "expired" in reason -> R.string.bet_slip_market_closed
        flow == SubmissionFlow.BET && httpStatus == 409 -> R.string.bet_slip_odds_changed
        flow == SubmissionFlow.BET -> R.string.bet_slip_submission_failed
        httpStatus == 409 -> R.string.journey_data_changed
        flow == SubmissionFlow.DEPOSIT || flow == SubmissionFlow.WITHDRAWAL -> R.string.journey_transaction_failed_unknown
        else -> R.string.journey_submission_failed
    }
}
