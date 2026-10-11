package com.pro.uclfootball.ui

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable fun BulletinHeading(title: String, onBack: () -> Unit, description: String? = null) {
    Column {
        TextButton(onClick = onBack, contentPadding = PaddingValues(0.dp), modifier = Modifier.heightIn(min = 48.dp)) {
            WebIcon("arrow_left", tint = MaterialTheme.colorScheme.primary)
            Spacer(Modifier.width(8.dp)); Text(webCopy("common.back"))
        }
        Text(title, fontFamily = WebInter, fontSize = 28.sp, lineHeight = 36.sp, fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurface, modifier = Modifier.padding(top = 8.dp))
        description?.let { Text(it, color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(top = 8.dp)) }
        HorizontalDivider(Modifier.padding(top = 20.dp), thickness = 2.dp, color = MaterialTheme.colorScheme.primary)
    }
}

@Composable fun BulletinSection(title: String, content: @Composable ColumnScope.() -> Unit) {
    Surface(color = MaterialTheme.colorScheme.surface, shape = RoundedCornerShape(12.dp), border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)) {
        Column(Modifier.fillMaxWidth().padding(16.dp)) {
            Text(title, fontFamily = WebInter, fontSize = 18.sp, fontWeight = FontWeight.Bold)
            HorizontalDivider(Modifier.padding(top = 12.dp, bottom = 16.dp), color = MaterialTheme.colorScheme.primary, thickness = 2.dp)
            content()
        }
    }
}

@Composable fun BulletinFact(label: String, value: String, total: Boolean = false) {
    Row(Modifier.fillMaxWidth().then(if (total) Modifier.background(MaterialTheme.colorScheme.primaryContainer, RoundedCornerShape(6.dp)).padding(12.dp) else Modifier.padding(vertical = 12.dp)),
        horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.Top) {
        Text(label, Modifier.weight(1f), color = if (total) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)
        Text(value, Modifier.weight(1f), color = if (total) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onSurface,
            fontSize = 14.sp, fontWeight = FontWeight.SemiBold, textAlign = androidx.compose.ui.text.style.TextAlign.End)
    }
}

@Composable fun BulletinRefreshNotice(onRetry: () -> Unit) {
    Column(Modifier.fillMaxWidth().background(MaterialTheme.colorScheme.secondaryContainer, RoundedCornerShape(6.dp)).padding(12.dp)) {
        Text(webCopy("bulletin.refreshFailed"), color = MaterialTheme.colorScheme.onSecondaryContainer, fontSize = 13.sp)
        TextButton(onClick = onRetry) { Text(webCopy("bulletin.retry")) }
    }
}

@Composable fun BulletinTeam(name: String?, image: String?, large: Boolean = false) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        WebRemoteImage(image, Modifier.size(if (large) 36.dp else 28.dp))
        Text(name ?: webCopy("common.team"), fontFamily = WebInter, fontSize = if (large) 20.sp else 14.sp,
            fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onSurface,
            modifier = Modifier.weight(1f))
    }
}
