package com.womensafety.repository;

import com.womensafety.model.Incident;
import com.womensafety.model.IncidentStatus;
import com.womensafety.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, Long> {

    List<Incident> findByUser(User user);

    List<Incident> findByStatus(IncidentStatus status);
}