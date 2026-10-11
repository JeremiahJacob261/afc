package com.pro.uclfootball.home

import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.pro.uclfootball.R
import com.pro.uclfootball.ui.UclColors

@Composable
fun NativeBottomBar(selectedTab: String, onSelectTab: (String) -> Unit) {
    if (com.pro.uclfootball.ui.LocalUserShell.current) return
    NavigationBar(containerColor = Color.White) {
        val destinations = listOf(
            Triple("home", R.string.nav_home, R.drawable.ic_nav_home),
            Triple("matches", R.string.nav_matches, R.drawable.ic_nav_matches),
            Triple("bets", R.string.nav_bets, R.drawable.ic_nav_bets),
            Triple("wallet", R.string.nav_wallet, R.drawable.ic_nav_wallet),
            Triple("account", R.string.nav_account, R.drawable.ic_nav_account),
        )
        destinations.forEach { (route, labelId, iconId) ->
            val label = stringResource(labelId)
            NavigationBarItem(
                selected = selectedTab == route,
                onClick = { onSelectTab(route) },
                icon = {
                    Icon(
                        painter = painterResource(iconId),
                        contentDescription = null,
                        tint = if (selectedTab == route) UclColors.accent else UclColors.muted,
                    )
                },
                label = { Text(label, fontSize = 11.sp, fontWeight = FontWeight.SemiBold) },
                alwaysShowLabel = true,
            )
        }
    }
}
