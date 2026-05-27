package com.parkingfinder.controller;

import java.time.Instant;

import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.parkingfinder.domain.Role;
import com.parkingfinder.dto.UserProfileResponse;
import com.parkingfinder.service.JwtService;
import com.parkingfinder.service.UserService;

@WebMvcTest(UserController.class)
class UserControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockBean private UserService userService;
  @MockBean private JwtService jwtService;

  @Test
  @WithMockUser(username = "user-1@example.com", roles = "USER")
  void getCurrentUser_shouldReturnProfile_whenAuthenticated() throws Exception {
    UserProfileResponse response =
        new UserProfileResponse(
            1L,
            "user-1@example.com",
            "Demo User",
            Role.USER,
            Instant.parse("2026-05-27T00:00:00Z"));

    when(userService.getCurrentUserProfile("user-1@example.com")).thenReturn(response);

    mockMvc
        .perform(get("/users/me"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(1))
        .andExpect(jsonPath("$.email").value("user-1@example.com"))
        .andExpect(jsonPath("$.fullName").value("Demo User"))
        .andExpect(jsonPath("$.role").value("USER"));
  }

  @Test
  void getCurrentUser_shouldReturnUnauthorized_whenUnauthenticated() throws Exception {
    mockMvc
        .perform(get("/users/me"))
        .andExpect(status().isUnauthorized());
  }
}
