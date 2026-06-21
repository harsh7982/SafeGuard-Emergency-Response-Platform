package com.womensafety.dto;

import com.womensafety.model.User;

import java.util.Set;

public class UserResponse {

    private Long id;
    private String email;
    private String fullName;
    private Set<String> roles;

    public UserResponse(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.fullName = user.getFullName();
        this.roles = user.getRoles().stream().map(Enum::name).collect(java.util.stream.Collectors.toSet());
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getFullName() {
        return fullName;
    }

    public Set<String> getRoles() {
        return roles;
    }
}
