package com.medshare.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    private String id;

    private String name;

    @Indexed(unique = true)
    private String email;

    private String password;

    private String role; // PATIENT, PHARMACY, HOSPITAL, ADMIN

    private String phone;

    private String sourceId; // Linked Pharmacy or Hospital MedicalSource ID

    private String address;

    private String avatarUrl;

    private String city;

    private String pincode;

    @Builder.Default
    private String verificationStatus = "APPROVED"; // PENDING, APPROVED, REJECTED, SUSPENDED

    @Builder.Default
    private String accountStatus = "ACTIVE"; // ACTIVE, PENDING, SUSPENDED, DELETED

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    // Explicit Getters and Setters for IDEs without Lombok plugin
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getSourceId() { return sourceId; }
    public void setSourceId(String sourceId) { this.sourceId = sourceId; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }

    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }

    public String getAccountStatus() { return accountStatus; }
    public void setAccountStatus(String accountStatus) { this.accountStatus = accountStatus; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // Static Builder for full IDE compatibility without Lombok
    public static UserBuilder builder() {
        return new UserBuilder();
    }

    public static class UserBuilder {
        private String id;
        private String name;
        private String email;
        private String password;
        private String role;
        private String phone;
        private String sourceId;
        private String address;
        private String avatarUrl;
        private String city;
        private String pincode;
        private String verificationStatus = "APPROVED";
        private String accountStatus = "ACTIVE";
        private LocalDateTime createdAt = LocalDateTime.now();

        UserBuilder() {}

        public UserBuilder id(String id) { this.id = id; return this; }
        public UserBuilder name(String name) { this.name = name; return this; }
        public UserBuilder email(String email) { this.email = email; return this; }
        public UserBuilder password(String password) { this.password = password; return this; }
        public UserBuilder role(String role) { this.role = role; return this; }
        public UserBuilder phone(String phone) { this.phone = phone; return this; }
        public UserBuilder sourceId(String sourceId) { this.sourceId = sourceId; return this; }
        public UserBuilder address(String address) { this.address = address; return this; }
        public UserBuilder avatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; return this; }
        public UserBuilder city(String city) { this.city = city; return this; }
        public UserBuilder pincode(String pincode) { this.pincode = pincode; return this; }
        public UserBuilder verificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; return this; }
        public UserBuilder accountStatus(String accountStatus) { this.accountStatus = accountStatus; return this; }
        public UserBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public User build() {
            User user = new User();
            user.setId(this.id);
            user.setName(this.name);
            user.setEmail(this.email);
            user.setPassword(this.password);
            user.setRole(this.role);
            user.setPhone(this.phone);
            user.setSourceId(this.sourceId);
            user.setAddress(this.address);
            user.setAvatarUrl(this.avatarUrl);
            user.setCity(this.city);
            user.setPincode(this.pincode);
            user.setVerificationStatus(this.verificationStatus);
            user.setAccountStatus(this.accountStatus);
            user.setCreatedAt(this.createdAt);
            return user;
        }
    }
}
