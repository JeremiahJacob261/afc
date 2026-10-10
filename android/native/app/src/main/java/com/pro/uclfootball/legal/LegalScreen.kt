package com.pro.uclfootball.legal

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pro.uclfootball.R
import com.pro.uclfootball.ui.UclColors

@Composable
fun LegalRoute(isTerms: Boolean, onBack: () -> Unit) {
    Scaffold(
        contentWindowInsets = WindowInsets.statusBars,
        containerColor = UclColors.paper,
    ) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp, vertical = 18.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp),
        ) {
            TextButton(onClick = onBack, modifier = Modifier.fillMaxWidth()) {
                Text(stringResource(R.string.legal_back), modifier = Modifier.fillMaxWidth(), color = UclColors.accent)
            }
            Text(
                text = stringResource(if (isTerms) R.string.legal_terms_title else R.string.legal_privacy_title),
                color = UclColors.ink,
                fontFamily = FontFamily.Serif,
                fontWeight = FontWeight.Black,
                fontSize = 32.sp,
                lineHeight = 38.sp,
            )
            val paragraphs = if (isTerms) {
                listOf(R.string.legal_terms_intro, R.string.legal_terms_account, R.string.legal_terms_restrictions)
            } else {
                listOf(R.string.legal_privacy_collection, R.string.legal_privacy_storage, R.string.legal_privacy_contact)
            }
            paragraphs.forEach { resource ->
                Text(
                    text = stringResource(resource),
                    modifier = Modifier.fillMaxWidth(),
                    color = UclColors.body,
                    fontSize = 16.sp,
                    lineHeight = 26.sp,
                )
            }
            Text(stringResource(R.string.legal_last_updated), color = UclColors.muted, fontSize = 13.sp)
        }
    }
}
