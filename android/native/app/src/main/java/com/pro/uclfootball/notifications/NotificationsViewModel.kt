package com.pro.uclfootball.notifications

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pro.uclfootball.auth.AuthSessionRepository
import com.pro.uclfootball.network.ApiException
import com.pro.uclfootball.network.NotificationDto
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.io.IOException

data class NotificationsUiState(
    val isLoading: Boolean = true,
    val notifications: List<NotificationDto> = emptyList(),
    val error: NotificationsError? = null,
    val requiresSignIn: Boolean = false,
)

enum class NotificationsError { Network, General }

class NotificationsViewModel(
    private val repository: NotificationsRepository,
    private val authSessionRepository: AuthSessionRepository,
) : ViewModel() {
    private val mutableState = MutableStateFlow(NotificationsUiState())
    val state: StateFlow<NotificationsUiState> = mutableState.asStateFlow()

    init { refresh() }

    fun refresh() {
        mutableState.update { it.copy(isLoading = true, error = null, requiresSignIn = false) }
        viewModelScope.launch {
            try {
                val result = repository.getNotifications()
                mutableState.update { it.copy(isLoading = false, notifications = result) }
            } catch (error: CancellationException) {
                throw error
            } catch (error: ApiException) {
                if (error.httpStatus == 401 || error.httpStatus == 404) {
                    authSessionRepository.clear()
                    mutableState.update { it.copy(isLoading = false, requiresSignIn = true) }
                } else {
                    mutableState.update { it.copy(isLoading = false, error = NotificationsError.General) }
                }
            } catch (error: IOException) {
                mutableState.update { it.copy(isLoading = false, error = NotificationsError.Network) }
            } catch (error: Exception) {
                mutableState.update { it.copy(isLoading = false, error = NotificationsError.General) }
            }
        }
    }

    fun markRead(notification: NotificationDto) {
        val notificationId = notification.appNotificationId
            ?.takeUnless { it == JsonNull || it.jsonPrimitive.contentOrNull.isNullOrBlank() }
            ?: return
        if (!notification.readAt.isNullOrBlank()) return
        viewModelScope.launch {
            try {
                repository.markRead(notificationId)
                val refreshed = repository.getNotifications()
                mutableState.update { it.copy(notifications = refreshed) }
            } catch (error: CancellationException) {
                throw error
            } catch (error: ApiException) {
                if (error.httpStatus == 401 || error.httpStatus == 404) {
                    authSessionRepository.clear()
                    mutableState.update { it.copy(requiresSignIn = true) }
                }
            } catch (_: Exception) {
                // Keep the server's current unread marker; the user can tap again.
            }
        }
    }
}
