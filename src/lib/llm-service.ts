/**
 * LLM Service Abstraction Layer
 * Provides a unified interface for multiple LLM providers (Anthropic, Ollama, OpenAI, etc.)
 * Switch between providers with just environment variable changes
 */

import Anthropic from '@anthropic-ai/sdk'

// LLM Provider Types
export type LLMProvider = 'anthropic' | 'ollama' | 'openai'

// Configuration
interface LLMConfig {
  provider: LLMProvider
  model: string
  apiKey?: string
  baseURL?: string
  temperature?: number
  maxTokens?: number
}

// Response structure
export interface LLMResponse {
  text: string
  usage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
  model: string
  provider: LLMProvider
}

// Message structure
export interface LLMMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

/**
 * LLM Service Class
 * Handles communication with different LLM providers through a unified interface
 */
export class LLMService {
  private config: LLMConfig
  private anthropic?: Anthropic

  constructor(config?: Partial<LLMConfig>) {
    // Load config from environment variables with defaults
    this.config = {
      provider: (process.env.LLM_PROVIDER as LLMProvider) || config?.provider || 'anthropic',
      model: process.env.LLM_MODEL || config?.model || 'claude-3-haiku-20240307',
      apiKey: process.env.ANTHROPIC_API_KEY || config?.apiKey,
      baseURL: process.env.OLLAMA_BASE_URL || config?.baseURL || 'http://localhost:11434',
      temperature: config?.temperature ?? 0.7,
      maxTokens: config?.maxTokens ?? 2048
    }

    // Initialize provider clients
    if (this.config.provider === 'anthropic' && this.config.apiKey) {
      this.anthropic = new Anthropic({ apiKey: this.config.apiKey })
    }
  }

  /**
   * Generate a response from the configured LLM provider
   * @param messages - Array of conversation messages
   * @param systemPrompt - Optional system prompt (for providers that support it)
   * @returns LLMResponse object
   */
  async generateResponse(
    messages: LLMMessage[],
    systemPrompt?: string
  ): Promise<LLMResponse> {
    switch (this.config.provider) {
      case 'anthropic':
        return this.generateAnthropicResponse(messages, systemPrompt)

      case 'ollama':
        return this.generateOllamaResponse(messages, systemPrompt)

      case 'openai':
        return this.generateOpenAIResponse(messages, systemPrompt)

      default:
        throw new Error(`Unsupported LLM provider: ${this.config.provider}`)
    }
  }

  /**
   * Anthropic Claude implementation
   */
  private async generateAnthropicResponse(
    messages: LLMMessage[],
    systemPrompt?: string
  ): Promise<LLMResponse> {
    if (!this.anthropic) {
      throw new Error('Anthropic client not initialized. Check API key.')
    }

    // Filter out system messages (Anthropic uses separate system parameter)
    const userMessages = messages.filter(m => m.role !== 'system')

    const response = await this.anthropic.messages.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens!,
      temperature: this.config.temperature,
      system: systemPrompt || messages.find(m => m.role === 'system')?.content,
      messages: userMessages.map(m => ({
        role: m.role,
        content: m.content
      }))
    })

    return {
      text: response.content[0].type === 'text' ? response.content[0].text : '',
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens
      },
      model: this.config.model,
      provider: 'anthropic'
    }
  }

  /**
   * Ollama local LLM implementation
   */
  private async generateOllamaResponse(
    messages: LLMMessage[],
    systemPrompt?: string
  ): Promise<LLMResponse> {
    // Combine system prompt and messages into a single prompt for Ollama
    const systemMessage = systemPrompt || messages.find(m => m.role === 'system')?.content || ''
    const userMessages = messages.filter(m => m.role !== 'system')

    const fullPrompt = [
      systemMessage,
      ...userMessages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    ].filter(Boolean).join('\n\n')

    const ollamaResponse = await fetch(`${this.config.baseURL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model,
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: this.config.temperature,
          num_predict: this.config.maxTokens
        }
      })
    })

    if (!ollamaResponse.ok) {
      throw new Error(`Ollama API error: ${ollamaResponse.status}`)
    }

    const data = await ollamaResponse.json()

    return {
      text: data.response?.trim() || '',
      usage: {
        inputTokens: data.prompt_eval_count || 0,
        outputTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
      },
      model: this.config.model,
      provider: 'ollama'
    }
  }

  /**
   * OpenAI GPT implementation
   */
  private async generateOpenAIResponse(
    messages: LLMMessage[],
    systemPrompt?: string
  ): Promise<LLMResponse> {
    // Add system prompt as first message if provided
    const allMessages = systemPrompt
      ? [{ role: 'system' as const, content: systemPrompt }, ...messages]
      : messages

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: allMessages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      })
    })

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.status}`)
    }

    const data = await openaiResponse.json()

    return {
      text: data.choices[0]?.message?.content || '',
      usage: {
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      },
      model: this.config.model,
      provider: 'openai'
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): LLMConfig {
    return { ...this.config }
  }

  /**
   * Update configuration (useful for runtime switching)
   */
  updateConfig(newConfig: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...newConfig }

    // Reinitialize clients if provider or API key changed
    if (newConfig.provider === 'anthropic' || newConfig.apiKey) {
      if (this.config.apiKey) {
        this.anthropic = new Anthropic({ apiKey: this.config.apiKey })
      }
    }
  }
}

// Singleton instance for easy importing
export const llmService = new LLMService()
