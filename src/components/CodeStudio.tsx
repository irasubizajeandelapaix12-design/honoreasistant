import React, { useState, useMemo } from 'react';
import {
  Play,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  Eye,
  Terminal,
  Code2,
  ChevronDown,
  Search,
  Cpu,
  FileCode2,
  BookOpen,
  Layers,
  Wrench,
  Bug,
  TestTube,
} from 'lucide-react';
import { executeCode } from '../services/api.js';

interface CodeStudioProps {
  initialCode?: string;
  initialLanguage?: string;
  onAskAi: (prompt: string) => void;
}

export interface LanguageInfo {
  id: string;
  name: string;
  category: 'web' | 'backend' | 'data' | 'formats';
  filename: string;
  badge: string;
  description: string;
  runtimeBadge: string;
  template: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  // 1. FRONTEND & WEB
  {
    id: 'javascript',
    name: 'JavaScript (Node / ES2022)',
    category: 'web',
    filename: 'index.js',
    badge: 'JS',
    description: 'Modern ES2022 async workflows, closures, algorithms & Array pipelines',
    runtimeBadge: 'Node.js Isolated VM',
    template: `// Honore Assistant - JavaScript Engine (ES2022)
// High-performance data pipeline with async simulation

function analyzePerformance(benchmarks) {
  console.log("Analyzing telemetry data points:", benchmarks.length);
  
  const totalLatency = benchmarks.reduce((acc, curr) => acc + curr.latencyMs, 0);
  const avgLatency = (totalLatency / benchmarks.length).toFixed(2);
  const successRate = ((benchmarks.filter(b => b.status === 200).length / benchmarks.length) * 100).toFixed(1);

  return {
    sampleCount: benchmarks.length,
    averageLatencyMs: Number(avgLatency),
    successRate: \`\${successRate}%\`,
    fastestNode: [...benchmarks].sort((a, b) => a.latencyMs - b.latencyMs)[0],
  };
}

const samples = [
  { region: 'us-east-1', latencyMs: 42, status: 200 },
  { region: 'eu-west-1', latencyMs: 88, status: 200 },
  { region: 'ap-northeast-1', latencyMs: 145, status: 200 },
  { region: 'sa-east-1', latencyMs: 198, status: 503 },
];

console.log("Telemetry computation started...");
analyzePerformance(samples);`,
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    category: 'web',
    filename: 'app.ts',
    badge: 'TS',
    description: 'Strict static typing, interfaces, generics & domain models',
    runtimeBadge: 'TypeScript Typed VM',
    template: `// Honore Assistant - TypeScript Interface & Task Pipeline
interface AgentTask {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  completed: boolean;
}

class TaskManager {
  private tasks: AgentTask[] = [];

  addTask(task: AgentTask): void {
    this.tasks.push(task);
    console.log(\`Added task: [\${task.priority.toUpperCase()}] \${task.title}\`);
  }

  getPendingHighPriority(): AgentTask[] {
    return this.tasks.filter(t => !t.completed && (t.priority === 'high' || t.priority === 'critical'));
  }
}

const manager = new TaskManager();
manager.addTask({ id: '1', title: 'Implement Neural Cache', priority: 'critical', tags: ['ai', 'perf'], completed: false });
manager.addTask({ id: '2', title: 'Audit API Rate Limits', priority: 'medium', tags: ['security'], completed: true });
manager.addTask({ id: '3', title: 'Tune LLM Temperature', priority: 'high', tags: ['eval'], completed: false });

console.log("Pending High/Critical Tasks Count:", manager.getPendingHighPriority().length);
manager.getPendingHighPriority();`,
  },
  {
    id: 'html',
    name: 'HTML5 & Modern CSS',
    category: 'web',
    filename: 'index.html',
    badge: 'HTML',
    description: 'Live interactive frontend component with live Web Preview rendering',
    runtimeBadge: 'Live Web Preview',
    template: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #090d16;
      color: #f1f5f9;
      padding: 2rem;
      margin: 0;
      display: flex;
      justify-content: center;
    }
    .card {
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 16px;
      padding: 2rem;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-bottom: 1rem;
      border: 1px solid rgba(99, 102, 241, 0.3);
    }
    h2 { margin: 0 0 0.5rem 0; font-size: 1.5rem; color: #fff; }
    p { color: #94a3b8; font-size: 0.875rem; line-height: 1.5; margin: 0 0 1.5rem 0; }
    .btn {
      background: #4f46e5;
      color: #ffffff;
      border: none;
      padding: 0.75rem 1.25rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn:hover { background: #4338ca; }
    .status-box {
      margin-top: 1.25rem;
      padding: 0.75rem;
      border-radius: 8px;
      background: #1e293b;
      font-family: monospace;
      font-size: 0.8rem;
      color: #38bdf8;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Honore Assistant UI Engine</div>
    <h2>Interactive Component Sandbox</h2>
    <p>Live sandbox component rendered directly inside the assistant. Modify the markup and click the button below to trigger dynamic DOM events.</p>
    <button class="btn" onclick="handleClick()">Trigger Client Event</button>
    <div id="output" class="status-box">Status: Ready for interaction</div>
  </div>

  <script>
    let clicks = 0;
    function handleClick() {
      clicks++;
      document.getElementById('output').innerText = 
        'Dispatched event #' + clicks + ' at ' + new Date().toLocaleTimeString();
    }
  </script>
</body>
</html>`,
  },
  {
    id: 'react',
    name: 'React (JSX / TSX)',
    category: 'web',
    filename: 'Widget.tsx',
    badge: 'JSX',
    description: 'React functional component structure, hooks, state & virtual DOM',
    runtimeBadge: 'Component Preview',
    template: `// Honore Assistant - React Functional Component
import React, { useState } from 'react';

export function AnalyticsWidget({ title = "System Throughput" }) {
  const [metric, setMetric] = useState(1420);
  const [isLive, setIsLive] = useState(true);

  const handleRefresh = () => {
    const delta = Math.floor(Math.random() * 80) - 40;
    setMetric(prev => Math.max(100, prev + delta));
  };

  return (
    <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl max-w-sm text-slate-100 font-sans shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm text-slate-300">{title}</h3>
        <span className={\`text-xs px-2 py-0.5 rounded-full font-mono \${isLive ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'}\`}>
          {isLive ? '● Live' : '○ Paused'}
        </span>
      </div>

      <div className="text-3xl font-bold font-mono tracking-tight text-white mb-2">
        {metric.toLocaleString()} <span className="text-xs text-slate-400 font-normal">req/sec</span>
      </div>

      <button 
        onClick={handleRefresh}
        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition"
      >
        Simulate Traffic Surge
      </button>
    </div>
  );
}`,
  },
  {
    id: 'vue',
    name: 'Vue.js 3 (SFC)',
    category: 'web',
    filename: 'MetricsCard.vue',
    badge: 'VUE',
    description: 'Vue 3 Single File Component with <script setup>, reactivity & scoped CSS',
    runtimeBadge: 'Vue SFC Preview',
    template: `<script setup>
import { ref, computed } from 'vue';

const counter = ref(42);
const status = ref('optimal');

const isHighLoad = computed(() => counter.value > 100);

function incrementLoad() {
  counter.value += 15;
  if (counter.value > 100) {
    status.value = 'high';
  }
}
</script>

<template>
  <div class="metrics-card">
    <div class="header">
      <h4>Cluster Health Monitor</h4>
      <span :class="['pill', status]">{{ status.toUpperCase() }}</span>
    </div>
    <div class="metric-val">{{ counter }} Active Pods</div>
    <p v-if="isHighLoad" class="alert">⚠️ Autoscaling initiated!</p>
    <button @click="incrementLoad">Spawn Workloads</button>
  </div>
</template>

<style scoped>
.metrics-card { background: #0f172a; padding: 1.5rem; border-radius: 12px; border: 1px solid #334155; color: #fff; }
.header { display: flex; justify-content: space-between; align-items: center; }
.pill { padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.7rem; font-weight: bold; }
.pill.optimal { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
.pill.high { background: rgba(239, 68, 68, 0.2); color: #f87171; }
.metric-val { font-size: 1.75rem; font-family: monospace; margin: 1rem 0; font-weight: bold; }
.alert { color: #f59e0b; font-size: 0.85rem; }
button { background: #3b82f6; border: none; padding: 0.5rem 1rem; color: #fff; border-radius: 6px; cursor: pointer; }
</style>`,
  },

  // 2. BACKEND & SYSTEMS
  {
    id: 'python',
    name: 'Python 3',
    category: 'backend',
    filename: 'main.py',
    badge: 'PY',
    description: 'Native Python 3.10 interpreter, mathematical algorithms, data processing & dictionaries',
    runtimeBadge: 'Native Python 3.10',
    template: `# Honore Assistant - Native Python 3.10 Interpreter
import sys
import math
import time

def calculate_statistical_distribution(values: list[float]) -> dict:
    """Compute central tendency and variance metrics."""
    n = len(values)
    mean = sum(values) / n
    variance = sum((x - mean) ** 2 for x in values) / n
    std_dev = math.sqrt(variance)
    
    return {
        "count": n,
        "mean": round(mean, 2),
        "std_dev": round(std_dev, 2),
        "min": min(values),
        "max": max(values),
    }

print(f"Python Runtime: {sys.version.split()[0]} on {sys.platform}")

# Generate test distribution
datapoints = [12.4, 15.8, 14.2, 19.5, 22.1, 18.0, 16.7, 25.4, 21.0, 17.3]
stats = calculate_statistical_distribution(datapoints)

print("--- Statistical Distribution ---")
for key, val in stats.items():
    print(f"  {key.ljust(10)}: {val}")

# List comprehension & prime calculation
primes = [x for x in range(2, 50) if all(x % d != 0 for d in range(2, int(x**0.5) + 1))]
print(f"Primes up to 50 ({len(primes)} found): {primes}")`,
  },
  {
    id: 'java',
    name: 'Java (OOP & Streams)',
    category: 'backend',
    filename: 'Main.java',
    badge: 'JAVA',
    description: 'Modern Java 17/21 records, Stream API pipelines & object-oriented design',
    runtimeBadge: 'Java Static Verifier',
    template: `// Honore Assistant - Java 17+ Modern OOP & Stream API
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class Main {
    public record Project(String id, String name, String department, double budget, boolean isActive) {}

    public static void main(String[] args) {
        List<Project> portfolio = List.of(
            new Project("P-1", "AI Copilot Engine", "Engineering", 120_000.0, true),
            new Project("P-2", "Zero-Trust Mesh", "Security", 85_000.0, true),
            new Project("P-3", "Legacy Migration", "Operations", 45_000.0, false),
            new Project("P-4", "Vector Memory DB", "Engineering", 150_000.0, true)
        );

        System.out.println("=== Active Engineering Projects ===");
        portfolio.stream()
            .filter(Project::isActive)
            .filter(p -> "Engineering".equalsIgnoreCase(p.department()))
            .forEach(p -> System.out.println(" - " + p.name() + " ($" + p.budget() + ")"));

        double totalActiveBudget = portfolio.stream()
            .filter(Project::isActive)
            .mapToDouble(Project::budget)
            .sum();

        System.out.println("Total Allocated Active Budget: $" + totalActiveBudget);
    }
}`,
  },
  {
    id: 'c',
    name: 'C (C99 / C11)',
    category: 'backend',
    filename: 'main.c',
    badge: 'C',
    description: 'Low-level systems programming, pointer mechanics, structs & memory safety',
    runtimeBadge: 'C Standards Verifier',
    template: `// Honore Assistant - C Language (C99 Standard)
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    char name[32];
    int priority;
    double score;
} SystemNode;

void print_node_summary(const SystemNode *node) {
    printf("[NODE: %s] Priority=%d, Score=%.2f\\n", node->name, node->priority, node->score);
}

int main(void) {
    SystemNode cluster[3] = {
        {"core-alpha", 1, 99.4},
        {"worker-beta", 2, 87.2},
        {"worker-gamma", 2, 92.8}
    };

    printf("=== High-Availability Cluster Topology ===\\n");
    for (int i = 0; i < 3; i++) {
        print_node_summary(&cluster[i]);
    }

    printf("Cluster initialized with 0 segmentation faults.\\n");
    return 0;
}`,
  },
  {
    id: 'cpp',
    name: 'C++ (C++20)',
    category: 'backend',
    filename: 'main.cpp',
    badge: 'C++',
    description: 'Modern C++20 STL algorithms, smart pointers, lambdas & template metaprogramming',
    runtimeBadge: 'C++20 Compiler Engine',
    template: `// Honore Assistant - Modern C++20
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <numeric>

struct Microservice {
    std::string name;
    int latency_ms;
    bool healthy;
};

int main() {
    std::vector<Microservice> mesh = {
        {"auth-service", 24, true},
        {"payment-gateway", 112, true},
        {"analytics-indexer", 340, false},
        {"notification-hub", 45, true}
    };

    std::cout << "=== Microservice Mesh Health Inspection ===" << std::endl;
    for (const auto& svc : mesh) {
        std::cout << (svc.healthy ? "[ONLINE] " : "[DEGRADED] ")
                  << svc.name << " (" << svc.latency_ms << "ms)" << std::endl;
    }

    auto count_healthy = std::count_if(mesh.begin(), mesh.end(), [](const auto& s) {
        return s.healthy;
    });

    std::cout << "Healthy Services: " << count_healthy << "/" << mesh.size() << std::endl;
    return 0;
}`,
  },
  {
    id: 'csharp',
    name: 'C# (.NET Core)',
    category: 'backend',
    filename: 'Program.cs',
    badge: 'C#',
    description: 'C# 12 LINQ expressions, pattern matching, records & async tasks',
    runtimeBadge: '.NET Engine Verifier',
    template: `// Honore Assistant - C# 12 / .NET
using System;
using System.Collections.Generic;
using System.Linq;

public record ServerMetric(string Host, double CpuPercent, double RamGb);

public class Program {
    public static void Main() {
        var metrics = new List<ServerMetric> {
            new("srv-01", 34.5, 12.2),
            new("srv-02", 89.2, 28.5),
            new("srv-03", 45.1, 14.0),
            new("srv-04", 94.8, 30.1)
        };

        Console.WriteLine("=== High-Load Servers Detected (>80% CPU) ===");
        var overloaded = metrics.Where(m => m.CpuPercent > 80.0).ToList();
        
        foreach (var server in overloaded) {
            Console.WriteLine($"ALERT: {server.Host} - CPU: {server.CpuPercent}% | RAM: {server.RamGb}GB");
        }

        Console.WriteLine($"Total Monitored Nodes: {metrics.Count}");
    }
}`,
  },
  {
    id: 'go',
    name: 'Go (Golang)',
    category: 'backend',
    filename: 'main.go',
    badge: 'GO',
    description: 'Go concurrency patterns, channels, goroutines, structs & robust error handling',
    runtimeBadge: 'Go Toolchain Verifier',
    template: `// Honore Assistant - Go Concurrency & Pipelines
package main

import (
	"fmt"
	"time"
)

type WorkerResult struct {
	ID    int
	Speed float64
	Msg   string
}

func executeTask(id int, ch chan<- WorkerResult) {
	time.Sleep(10 * time.Millisecond)
	ch <- WorkerResult{
		ID:    id,
		Speed: float64(id) * 1.45,
		Msg:   fmt.Sprintf("Worker %d completed vector embedding", id),
	}
}

func main() {
	fmt.Println("=== Go Concurrency Worker Pool ===")
	resultsChannel := make(chan WorkerResult, 3)

	for i := 1; i <= 3; i++ {
		go executeTask(i, resultsChannel)
	}

	for i := 1; i <= 3; i++ {
		res := <-resultsChannel
		fmt.Printf("Received: %s (Latency: %.2fms)\\n", res.Msg, res.Speed)
	}

	fmt.Println("All goroutines completed cleanly.")
}`,
  },
  {
    id: 'rust',
    name: 'Rust (2021 Edition)',
    category: 'backend',
    filename: 'main.rs',
    badge: 'RS',
    description: 'Memory safety without garbage collection, pattern matching, Result & Option types',
    runtimeBadge: 'Rust Cargo Verifier',
    template: `// Honore Assistant - Modern Rust
#[derive(Debug)]
struct NeuralJob {
    id: u32,
    batch_size: usize,
    converged: bool,
}

fn process_job(job: &NeuralJob) -> Result<String, &'static str> {
    if job.batch_size == 0 {
        return Err("Invalid batch size: must be > 0");
    }
    Ok(format!("Job #{} trained with {} samples successfully", job.id, job.batch_size))
}

fn main() {
    println!("=== Rust Memory-Safe Worker ===");
    let jobs = vec![
        NeuralJob { id: 101, batch_size: 64, converged: true },
        NeuralJob { id: 102, batch_size: 128, converged: true },
        NeuralJob { id: 103, batch_size: 0, converged: false },
    ];

    for job in &jobs {
        match process_job(job) {
            Ok(msg) => println!("[SUCCESS] {}", msg),
            Err(err) => println!("[ERROR] Job #{} failed: {}", job.id, err),
        }
    }

    println!("Zero memory leaks, guaranteed by borrow checker.");
}`,
  },
  {
    id: 'php',
    name: 'PHP 8.2',
    category: 'backend',
    filename: 'index.php',
    badge: 'PHP',
    description: 'Modern PHP 8 typed properties, attributes, match expressions & array pipelines',
    runtimeBadge: 'PHP 8 Engine Verifier',
    template: `<?php
// Honore Assistant - Modern PHP 8.2 Script
declare(strict_types=1);

class ApiRouter {
    public function __construct(
        public readonly string $version = "v2.1",
        private array $routes = []
    ) {}

    public function register(string $method, string $path, string $handler): void {
        $this->routes[] = compact('method', 'path', 'handler');
        echo "Registered route: [{$method}] {$path} -> {$handler}\\n";
    }

    public function getRouteCount(): int {
        return count($this->routes);
    }
}

$router = new ApiRouter();
$router->register('GET', '/api/users', 'UserController::list');
$router->register('POST', '/api/auth/token', 'AuthController::login');
$router->register('GET', '/api/health', 'HealthController::check');

echo "Total Active Endpoints: " . $router->getRouteCount() . "\\n";
?>`,
  },
  {
    id: 'ruby',
    name: 'Ruby',
    category: 'backend',
    filename: 'script.rb',
    badge: 'RB',
    description: 'Elegant object-oriented scripting, blocks, symbols & enumerable transformations',
    runtimeBadge: 'Ruby MRI Verifier',
    template: `# Honore Assistant - Ruby 3.x Script
class DeploymentPipeline
  attr_reader :environment, :services

  def initialize(environment)
    @environment = environment
    @services = []
  end

  def add_service(name, version)
    @services << { name: name, version: version, status: :pending }
  end

  def deploy_all!
    puts "🚀 Deploying to #{@environment.upcase}..."
    @services.each do |svc|
      svc[:status] = :deployed
      puts "  ✓ Deployed #{svc[:name]} (#{svc[:version]})"
    end
  end
end

pipeline = DeploymentPipeline.new("production")
pipeline.add_service("api-gateway", "v1.4.2")
pipeline.add_service("auth-service", "v2.0.1")
pipeline.add_service("worker-queue", "v1.1.0")

pipeline.deploy_all!
puts "All #{pipeline.services.size} microservices successfully verified."`,
  },

  // 3. DATA, SHELL & DATABASE
  {
    id: 'sql',
    name: 'SQL (Relational Database)',
    category: 'data',
    filename: 'query.sql',
    badge: 'SQL',
    description: 'Direct SQL execution against local database tables: projects & team_members',
    runtimeBadge: 'In-Memory Relational Engine',
    template: `-- Honore Assistant - Relational SQL Engine
-- Queries live local tables: projects & team_members

SELECT 
    p.id,
    p.name AS project_name,
    p.status,
    p.budget,
    m.name AS lead_engineer,
    m.role
FROM projects p
LEFT JOIN team_members m ON p.lead = m.name
WHERE p.status IN ('active', 'planning')
ORDER BY p.budget DESC;`,
  },
  {
    id: 'bash',
    name: 'Bash / Linux Shell',
    category: 'data',
    filename: 'script.sh',
    badge: 'SH',
    description: 'Native Linux bash execution, process environment checks, loops & shell pipelines',
    runtimeBadge: 'Native Linux Bash',
    template: `#!/usr/bin/env bash
# Honore Assistant - Native Linux Bash Runner
echo "=== Host Environment Inspection ==="
echo "Date / Time: $(date)"
echo "Kernel: $(uname -s -r -m)"
echo "Current User: $(whoami)"
echo "Working Directory: $(pwd)"

echo ""
echo "=== Available Interpreters ==="
for cmd in python3 node bash git; do
  if command -v "$cmd" >/dev/null 2>&1; then
    printf "  %-10s : FOUND (%s)\\n" "$cmd" "$(command -v "$cmd")"
  else
    printf "  %-10s : NOT FOUND\\n" "$cmd"
  fi
done

echo ""
echo "Shell execution test completed successfully."`,
  },

  // 4. FORMATS & CONFIGS
  {
    id: 'json',
    name: 'JSON Schema & Data',
    category: 'formats',
    filename: 'payload.json',
    badge: 'JSON',
    description: 'Structured JSON data payload with deep validation and schema formatting',
    runtimeBadge: 'JSON Schema Parser',
    template: `{
  "system": "Honore Assistant",
  "version": "2.4.0",
  "agentConfig": {
    "temperature": 0.4,
    "maxTokens": 4096,
    "enableSearchGrounding": true,
    "persistentMemory": true
  },
  "capabilities": [
    "multi_language_code_studio",
    "voice_audio_companion",
    "relational_sql_engine",
    "document_intelligence",
    "task_automation_workflows"
  ],
  "clusterNodes": [
    { "id": "node-1", "role": "coordinator", "status": "active", "load": 0.28 },
    { "id": "node-2", "role": "worker", "status": "active", "load": 0.65 },
    { "id": "node-3", "role": "worker", "status": "active", "load": 0.42 }
  ]
}`,
  },
  {
    id: 'yaml',
    name: 'YAML Configuration',
    category: 'formats',
    filename: 'docker-compose.yml',
    badge: 'YML',
    description: 'Cloud infrastructure manifest, Docker compose & Kubernetes services',
    runtimeBadge: 'YAML Structure Verifier',
    template: `version: '3.8'

services:
  honore-assistant:
    image: node:22-alpine
    container_name: honore_core
    restart: always
    environment:
      - PORT=3000
      - NODE_ENV=production
      - GEMINI_MODEL=gemini-3.1-flash-lite
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3`,
  },
  {
    id: 'markdown',
    name: 'Markdown Documentation',
    category: 'formats',
    filename: 'README.md',
    badge: 'MD',
    description: 'Rich technical specification, documentation matrices & markdown preview',
    runtimeBadge: 'Markdown Formatter',
    template: `# Honore Assistant - Technical Architecture

Honore Assistant is an all-in-one personal AI assistant engineered for high-clarity reasoning, multilingual development, and secure sandbox execution.

## Supported Language Ecosystem

| Language | Primary Domain | Sandbox Engine |
| :--- | :--- | :--- |
| **Python** | AI, Analytics, Scripts | Native Python 3.10 |
| **JavaScript / TS** | Web Apps, Node.js | Isolated Node VM |
| **Bash / Shell** | DevOps, Automation | Native Linux Bash |
| **SQL** | Relational Queries | In-Memory SQLite Engine |
| **HTML / CSS / React / Vue** | Frontend Interfaces | Live Web Preview |
| **Go, Rust, Java, C/C++** | Systems & Microservices | Static Compiler Engine |

## Core Capabilities
- [x] High-clarity, direct reasoning with zero fluff
- [x] Multi-model resilient fallback
- [x] Full-stack Code Studio with 15+ languages
- [x] Voice Companion with real-time waveform visualization
- [x] Document Intelligence & Relational SQL Explorer`,
  },
];

export const CodeStudio: React.FC<CodeStudioProps> = ({
  initialCode,
  initialLanguage = 'javascript',
  onAskAi,
}) => {
  const [language, setLanguage] = useState<string>(initialLanguage);
  
  // Find current language config
  const currentLangConfig = useMemo(() => {
    return SUPPORTED_LANGUAGES.find(l => l.id === language) || SUPPORTED_LANGUAGES[0];
  }, [language]);

  const [code, setCode] = useState<string>(
    initialCode || currentLangConfig.template
  );
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'console' | 'preview'>('console');
  const [output, setOutput] = useState<{ stdout: string[]; result: any; executionTimeMs: number; error?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [langSearch, setLangSearch] = useState('');

  // Quick pills for most popular
  const quickLanguages = ['javascript', 'typescript', 'python', 'html', 'sql', 'bash', 'go', 'rust', 'java', 'cpp'];

  // Filtered languages for modal/dropdown
  const filteredLanguages = useMemo(() => {
    if (!langSearch.trim()) return SUPPORTED_LANGUAGES;
    const q = langSearch.toLowerCase();
    return SUPPORTED_LANGUAGES.filter(
      l => l.name.toLowerCase().includes(q) || l.id.toLowerCase().includes(q) || l.description.toLowerCase().includes(q)
    );
  }, [langSearch]);

  const handleRun = async () => {
    setIsRunning(true);
    try {
      const res = await executeCode(code, language);
      setOutput(res);
      if (language === 'html') {
        setActiveTab('preview');
      } else {
        setActiveTab('console');
      }
    } catch (err: any) {
      setOutput({ stdout: [], result: null, executionTimeMs: 0, error: err.message });
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectLanguage = (langId: string) => {
    setLanguage(langId);
    const target = SUPPORTED_LANGUAGES.find(l => l.id === langId);
    if (target) {
      setCode(target.template);
    }
    setIsLangMenuOpen(false);
    setOutput(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-57px)] w-full bg-slate-900 text-slate-100 overflow-hidden select-none">
      {/* Studio Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-4 lg:px-6 py-2.5 bg-slate-950 border-b border-slate-800 text-xs gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-semibold text-slate-200">
            <Code2 className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Code Studio</span>
          </div>

          {/* Quick Popular Pills */}
          <div className="hidden md:flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800">
            {quickLanguages.map(l => (
              <button
                key={l}
                onClick={() => handleSelectLanguage(l)}
                className={`px-2.5 py-1 rounded-md uppercase font-mono text-[11px] transition-colors ${
                  language === l ? 'bg-indigo-600 text-white font-medium shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Full Language Selector Button */}
          <div className="relative">
            <button
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 text-xs font-medium transition"
            >
              <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>{currentLangConfig.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu for all 15+ languages */}
            {isLangMenuOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-80 max-h-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
                <div className="p-2 border-b border-slate-800">
                  <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-950 rounded-lg border border-slate-800">
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search language (Python, Rust, SQL...)"
                      value={langSearch}
                      onChange={e => setLangSearch(e.target.value)}
                      className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
                  {filteredLanguages.map(langItem => (
                    <button
                      key={langItem.id}
                      onClick={() => handleSelectLanguage(langItem.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition ${
                        language === langItem.id ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-6 flex items-center justify-center font-mono font-bold text-[10px] bg-slate-950 border border-slate-800 rounded text-slate-400">
                          {langItem.badge}
                        </span>
                        <div className="truncate">
                          <div className="text-xs font-medium text-slate-200 truncate">{langItem.name}</div>
                          <div className="text-[10px] text-slate-500 truncate">{langItem.runtimeBadge}</div>
                        </div>
                      </div>
                      {language === langItem.id && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Ask Honore AI Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onAskAi(`Review and optimize this ${currentLangConfig.name} code for clean architecture, performance, and best practices:\n\`\`\`${language}\n${code}\n\`\`\``)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors font-medium text-xs"
              title="Ask Honore Assistant to analyze and optimize code"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">AI Review</span>
            </button>

            <button
              onClick={() => onAskAi(`Explain how this ${currentLangConfig.name} code works step by step with clear technical explanations:\n\`\`\`${language}\n${code}\n\`\`\``)}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors font-medium text-xs"
              title="Explain how this code functions"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Explain</span>
            </button>

            <button
              onClick={() => onAskAi(`Generate comprehensive unit tests and edge cases for this ${currentLangConfig.name} code:\n\`\`\`${language}\n${code}\n\`\`\``)}
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors font-medium text-xs"
              title="Generate unit test suites"
            >
              <TestTube className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tests</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            title="Copy code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg shadow-xs transition-colors disabled:opacity-50"
          >
            {isRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>Run Sandbox</span>
          </button>
        </div>
      </div>

      {/* Editor & Output Split Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden select-text">
        {/* Left Column: Code Editor */}
        <div className="flex flex-col h-full border-r border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-950/70 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-200">{currentLangConfig.filename}</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-indigo-300 font-sans">
                {currentLangConfig.runtimeBadge}
              </span>
            </div>
            <span>{code.split('\n').length} lines · {code.length} chars</span>
          </div>

          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            spellCheck={false}
            className="flex-1 w-full p-4 bg-transparent font-mono text-xs text-slate-100 placeholder-slate-500 resize-none focus:outline-hidden leading-relaxed"
          />
        </div>

        {/* Right Column: Execution Output / Web Preview */}
        <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('console')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  activeTab === 'console' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Execution Logs</span>
              </button>

              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  activeTab === 'preview' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Web Preview</span>
              </button>
            </div>

            {output && output.executionTimeMs > 0 && (
              <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                Time: {output.executionTimeMs}ms
              </span>
            )}
          </div>

          {activeTab === 'console' ? (
            <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-3">
              {!output ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 p-6 text-center">
                  <Terminal className="w-10 h-10 opacity-30 text-indigo-400" />
                  <p className="text-slate-400 font-sans text-sm font-medium">Ready to Execute</p>
                  <p className="text-slate-500 text-xs max-w-sm font-sans">
                    Click "Run Sandbox" to execute this {currentLangConfig.name} code. Live stdout, return values, and execution metrics will appear here.
                  </p>
                </div>
              ) : (
                <>
                  {output.error && (
                    <div className="p-3 bg-red-950/50 border border-red-800 text-red-300 rounded-lg">
                      <div className="font-semibold text-red-400 mb-1 flex items-center gap-1.5">
                        <Bug className="w-3.5 h-3.5" />
                        <span>Execution Error</span>
                      </div>
                      <pre className="whitespace-pre-wrap text-xs">{output.error}</pre>
                    </div>
                  )}

                  {output.stdout.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">Standard Output</div>
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 space-y-1">
                        {output.stdout.map((line, idx) => (
                          <div key={idx} className="whitespace-pre-wrap">{line}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {output.result !== null && (
                    <div className="space-y-1">
                      <div className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">Evaluated Return Value</div>
                      <pre className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-emerald-400 whitespace-pre-wrap">
                        {typeof output.result === 'object' ? JSON.stringify(output.result, null, 2) : String(output.result)}
                      </pre>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="flex-1 bg-white overflow-hidden">
              <iframe
                title="Web Preview"
                srcDoc={
                  language === 'html'
                    ? code
                    : `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem;background:#f8fafc;color:#1e293b;"><h3>Code Output Preview (${currentLangConfig.name})</h3><pre style="background:#e2e8f0;padding:1rem;border-radius:8px;overflow:auto;">${code
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')}</pre></body></html>`
                }
                className="w-full h-full border-0"
                sandbox="allow-scripts"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
