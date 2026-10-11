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
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pro.uclfootball.R
import com.pro.uclfootball.ui.UclColors

@Composable
fun FaqRoute(onBack: () -> Unit) {
    val expanded = remember { androidx.compose.runtime.mutableStateMapOf<Int, Boolean>() }
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(start = 16.dp, top = 32.dp, end = 16.dp, bottom = 48.dp)) {
        com.pro.uclfootball.ui.WebBack(com.pro.uclfootball.ui.webCopy("common.account"), onBack)
        Text(com.pro.uclfootball.ui.webCopy("website.faqTitle"), Modifier.padding(top = 24.dp), color = UclColors.ink, fontFamily = FontFamily.Serif, fontSize = 32.sp, lineHeight = 35.sp)
        Text(com.pro.uclfootball.ui.webCopy("website.faqIntro"), Modifier.padding(top = 12.dp, bottom = 32.dp), color = com.pro.uclfootball.ui.WebMuted, fontSize = 16.sp, lineHeight = 25.sp)
        repeat(com.pro.uclfootball.ui.webItemCount("mobile.faq.items")) { index ->
            Surface(Modifier.fillMaxWidth().padding(bottom = 12.dp), shape = RoundedCornerShape(12.dp), color = androidx.compose.ui.graphics.Color.White, border = BorderStroke(1.dp, UclColors.dashboardLine)) {
                Column {
                    Row(Modifier.fillMaxWidth().clickable { expanded[index] = expanded[index] != true }.padding(horizontal = 20.dp, vertical = 16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text(com.pro.uclfootball.ui.webCopy("mobile.faq.items.$index.q"), Modifier.weight(1f), fontSize = 16.sp, fontWeight = FontWeight.Bold)
                        com.pro.uclfootball.ui.WebIcon(if (expanded[index] == true) "chevron_down" else "chevron_down", Modifier.rotate(if (expanded[index] == true) 180f else 0f), com.pro.uclfootball.ui.WebMuted)
                    }
                    if (expanded[index] == true) Text(com.pro.uclfootball.ui.webCopy("mobile.faq.items.$index.a"), Modifier.padding(start = 20.dp, end = 20.dp, bottom = 20.dp), color = com.pro.uclfootball.ui.WebMuted, fontSize = 16.sp, lineHeight = 25.sp)
                }
            }
        }
    }
}
