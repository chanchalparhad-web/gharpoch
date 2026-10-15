package com.gharpoch.controller;

import com.gharpoch.service.EventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1/live")
@Tag(name = "Live Real-Time Stream", description = "Server-Sent Events (SSE) feed for live order notifications and sync")
public class LiveEventController {

    private final EventService eventService;

    public LiveEventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping(value = "/orders/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "Subscribe to live order events stream (SSE)")
    public SseEmitter subscribeOrderEvents() {
        return eventService.subscribe();
    }
}
