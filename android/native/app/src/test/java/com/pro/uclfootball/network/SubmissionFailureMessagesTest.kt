package com.pro.uclfootball.network

import com.pro.uclfootball.R
import org.junit.Assert.assertEquals
import org.junit.Test

class SubmissionFailureMessagesTest {
    @Test fun `invalid details are not mislabeled as minimum stake`() {
        assertEquals(R.string.bet_slip_invalid_details, submissionFailureMessage("Invalid bet details", flow = SubmissionFlow.BET))
        assertEquals(R.string.bet_slip_minimum_stake, submissionFailureMessage(code = "BET_MINIMUM_STAKE", flow = SubmissionFlow.BET))
    }

    @Test fun `unknown conflicts never claim that odds changed`() {
        assertEquals(R.string.bet_slip_submission_failed, submissionFailureMessage(httpStatus = 409, flow = SubmissionFlow.BET))
        assertEquals(R.string.bet_slip_request_conflict, submissionFailureMessage("Duplicate bet id", httpStatus = 409, flow = SubmissionFlow.BET))
        assertEquals(R.string.bet_slip_odds_changed, submissionFailureMessage(code = "BET_ODDS_CHANGED", flow = SubmissionFlow.BET))
    }

    @Test fun `legacy insufficient balance and session errors retain their cause`() {
        assertEquals(R.string.bet_slip_insufficient_balance, submissionFailureMessage("You do not have enough MMK to complete this bet", flow = SubmissionFlow.BET))
        assertEquals(R.string.journey_session_expired, submissionFailureMessage(httpStatus = 401, flow = SubmissionFlow.BET))
    }

    @Test fun `unknown mutations use an outcome check specific to the action`() {
        assertEquals(R.string.bet_slip_load_failed, submissionFailureMessage(httpStatus = 503, flow = SubmissionFlow.BET, submitted = false))
        assertEquals(R.string.journey_transaction_failed_unknown, submissionFailureMessage(httpStatus = 503, flow = SubmissionFlow.DEPOSIT))
        assertEquals(R.string.journey_wallet_unconfirmed, submissionFailureMessage(flow = SubmissionFlow.WALLET))
        assertEquals(R.string.journey_pin_unconfirmed, submissionFailureMessage(flow = SubmissionFlow.PIN))
        assertEquals(R.string.journey_fee_changed, submissionFailureMessage("Withdrawal fee changed", flow = SubmissionFlow.WITHDRAWAL))
    }
}
