package com.example.weather.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/weather")
@CrossOrigin(origins = "*")
public class WeatherStationsController {

    @Value("${api.weather.noaa.metarUrl}")
    private String metarUrl;

    private final WebClient webClient;

    public WeatherStationsController() {
        this.webClient = WebClient.builder().build();
    }

    @GetMapping("/stations")
    @Cacheable("weatherStations")
    public Mono<ResponseEntity<String>> getWeatherStations(
            @RequestParam(defaultValue = "csv") String format,
            @RequestParam(defaultValue = "4") String hours) {
        
        String url = metarUrl + "?format=" + format + "&hours=" + hours;
        
        return webClient.get()
                .uri(url)
                .retrieve()
                .bodyToMono(String.class)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(500).body("Error fetching weather station data"));
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Weather API is running");
    }
}
