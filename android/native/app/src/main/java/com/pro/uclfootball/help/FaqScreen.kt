package com.pro.uclfootball.help

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pro.uclfootball.R
import com.pro.uclfootball.ui.UclColors

@Composable
fun FaqRoute(onBack: () -> Unit) {
    var expandedIndex by remember { mutableIntStateOf(-1) }
    Scaffold(
        contentWindowInsets = WindowInsets.statusBars,
        containerColor = UclColors.paper,
    ) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState())
                .padding(horizontal = 18.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            TextButton(onClick = onBack, modifier = Modifier.align(Alignment.Start)) {
                Text(stringResource(R.string.faq_back), color = UclColors.accent)
            }
            Text(
                stringResource(R.string.faq_title),
                color = UclColors.ink,
                fontFamily = FontFamily.Serif,
                fontSize = 30.sp,
                lineHeight = 36.sp,
            )
            Text(stringResource(R.string.faq_intro), color = UclColors.body, fontSize = 15.sp, lineHeight = 23.sp)
            (1..3).forEach { index ->
                val question = stringResource(
                    when (index) {
                        1 -> R.string.faq_q1
                        2 -> R.string.faq_q2
                        else -> R.string.faq_q3
                    },
                )
                val answer = stringResource(
                    when (index) {
                        1 -> R.string.faq_a1
                        2 -> R.string.faq_a2
                        else -> R.string.faq_a3
                    },
                )
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    color = UclColors.surface,
                    border = BorderStroke(1.dp, UclColors.dashboardLine),
                ) {
                    Column {
                        Row(
                            modifier = Modifier.fillMaxWidth().clickable {
                                expandedIndex = if (expandedIndex == index) -1 else index
                            }.padding(horizontal = 16.dp, vertical = 18.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(question, modifier = Modifier.weight(1f), color = UclColors.ink, fontWeight = FontWeight.SemiBold)
                            Text(if (expandedIndex == index) "−" else "+", color = UclColors.accent, fontSize = 22.sp)
                        }
                        if (expandedIndex == index) {
                            Text(
                                answer,
                                modifier = Modifier.fillMaxWidth().padding(start = 16.dp, end = 16.dp, bottom = 18.dp),
                                color = UclColors.body,
                                fontSize = 14.sp,
                                lineHeight = 22.sp,
                            )
                        }
                    }
                }
            }
        }
    }
}
