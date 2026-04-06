document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('prediction-form');
    const resultCard = document.getElementById('result-card');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = submitBtn.querySelector('span');
    const spinner = submitBtn.querySelector('.spinner');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Gather data
        const formData = {
            time_of_day: document.getElementById('time_of_day').value,
            neighborhood: document.getElementById('neighborhood').value,
            vehicle_type: document.getElementById('vehicle_type').value,
            reporting_entity: document.getElementById('reporting_entity').value,
        };

        // UI Loading state
        btnText.textContent = "Analyzing...";
        spinner.classList.remove('hidden');
        submitBtn.disabled = true;

        try {
            // In a real deployed app, this might just be '/api/predict'
            // For now, since we serve statically on same port, we can use relative path
            const response = await fetch('/api/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error("Failed to fetch prediction");
            }

            const data = await response.json();
            
            // Wait a tiny bit extra for visual effect
            setTimeout(() => {
                displayResult(data.prediction, data.confidence, data.metrics);
                
                // Reset button
                btnText.textContent = "Analyze Severity";
                spinner.classList.add('hidden');
                submitBtn.disabled = false;
            }, 600);

        } catch (error) {
            console.error("Error:", error);
            alert("Error connecting to the prediction API. Ensure backend is running.");
            
            // Reset button
            btnText.textContent = "Analyze Severity";
            spinner.classList.add('hidden');
            submitBtn.disabled = false;
        }
    });

    function displayResult(prediction, confidence, metrics) {
        // Reset classes
        resultCard.className = 'result-card show-result';
        
        // Define styling mapping
        let severityClass = '';
        let icon = '';
        
        if (prediction === 'Property damage only') {
            severityClass = 'severity-damage';
            icon = '⚠️';
        } else if (prediction === 'Injuries') {
            severityClass = 'severity-injury';
            icon = '🚑';
        } else if (prediction === 'Fatalities') {
            severityClass = 'severity-fatality';
            icon = '🚨';
        }

        resultCard.classList.add(severityClass);

        const confidencePercent = (confidence * 100).toFixed(1);
        
        // Build metrics HTML securely (if metrics exist)
        let metricsHtml = '';
        if (metrics) {
            metricsHtml = `
                <div class="metrics-grid">
                    <div class="metric-item">
                        <div class="metric-label">Accuracy</div>
                        <div class="metric-value">${(metrics.accuracy * 100).toFixed(1)}%</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-label">F1-Score</div>
                        <div class="metric-value">${metrics.f1_score.toFixed(2)}</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-label">AUC-ROC</div>
                        <div class="metric-value">${metrics.auc_roc.toFixed(2)}</div>
                    </div>
                </div>
            `;
        }

        resultCard.innerHTML = `
            <div class="empty-icon">${icon}</div>
            <div class="prediction-title">Predicted Severity</div>
            <div class="severity-badge">${prediction}</div>
            
            <div class="confidence-meter">
                <div class="confidence-header">
                    <span>Model Confidence</span>
                    <span>${confidencePercent}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
            </div>
            
            ${metricsHtml}
            
            <p style="margin-top: 1.5rem; font-size: 0.85rem; opacity: 0.7;">
                Recommendation: Dispatch units corresponding to anticipated casualty levels.
            </p>
        `;

        // Animate the progress bar after DOM update
        setTimeout(() => {
            const fill = resultCard.querySelector('.progress-fill');
            if(fill) {
                fill.style.width = `${confidencePercent}%`;
            }
        }, 50);
    }
});
