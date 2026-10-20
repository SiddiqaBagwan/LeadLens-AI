# LeadLens AI

### AI-Powered Call Analysis & Purchase Potential Assessment

LeadLens AI is a call intelligence application that analyzes customer
conversations to help sales teams understand customer sentiment, buying
signals, unresolved objections, and purchase potential.

## Features

- Four sample customer call recordings
- Audio playback
- Speech-to-text transcription using Whisper
- AI-powered sentiment analysis
- Customer needs and pain-point identification
- Buying signal and objection detection
- Purchase potential scoring
- Recommended sales follow-up actions
- PDF reports for individual calls
- Analytics dashboard

## Technology Stack

### Frontend
- React
- Vite

### Backend
- Python
- FastAPI
- Pydantic

### AI and Analysis
- faster-whisper for transcription
- Gemini API for structured conversation analysis
- Python-based purchase potential scoring

### Reporting
- ReportLab for PDF generation

## Application Architecture

Customer Call Recording
        |
        v
Speech-to-Text Transcription
        |
        v
AI Conversation Analysis
        |
        v
Structured Customer Insights
        |
        v
Purchase Potential Scoring
        |
        v
Dashboard and PDF Report

## Purchase Potential Scoring

The application evaluates the following dimensions:

- Buying Intent
- Budget Fit
- Urgency and Timeline
- Product Fit
- Engagement
- Objections Impact

The score uses a weighted heuristic to support sales decisions.

It is a decision-support score and is not a statistically calibrated
probability of a customer making a purchase.

## Local Setup

### Prerequisites

- Python
- Node.js and npm
- A Gemini API key

