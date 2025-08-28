package com.example.weather.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

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
        @RequestParam(defaultValue = "json") String format,
        @RequestParam(defaultValue = "2") String hours,
        @RequestParam(required = false, name = "ids") String ids,
        @RequestParam(required = false, name = "bbox") String bbox,
        @RequestParam(required = false, name = "gbox") String gbox,
        @RequestParam(required = false, name = "output") String output,
        @RequestParam(required = false, name = "taf") String taf,
        @RequestParam(required = false, name = "order") String order,
        @RequestParam(required = false, name = "latest") String latest,
        @RequestParam(required = false, name = "date") String date
    ) {

    // Build query with safe defaults; NOAA AWC recommends limiting scope.
    UriComponentsBuilder uriBuilder = UriComponentsBuilder.fromHttpUrl(metarUrl)
        .queryParam("format", format)
        .queryParam("hours", hours);

    // Default to top airports if no scope is provided
    if (ids == null && bbox == null && gbox == null) {
        ids = "@TOP";
    }
    if (ids != null) uriBuilder.queryParam("ids", ids);
    if (bbox != null) uriBuilder.queryParam("bbox", bbox);
    if (gbox != null) uriBuilder.queryParam("gbox", gbox);
    if (output != null) uriBuilder.queryParam("output", output);
    if (taf != null) uriBuilder.queryParam("taf", taf);
    if (order != null) uriBuilder.queryParam("order", order);
    if (latest != null) uriBuilder.queryParam("latest", latest);
    if (date != null) uriBuilder.queryParam("date", date);

    String url = uriBuilder.build(true).toUriString();

    return webClient.get()
        .uri(url)
        .accept(MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML, MediaType.TEXT_PLAIN)
        .retrieve()
        .bodyToMono(String.class)
        .map(ResponseEntity::ok)
        .onErrorResume(ex -> Mono.just(ResponseEntity.status(502).body("Error fetching weather station data: " + ex.getMessage())));
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Weather API is running");
    }
}
