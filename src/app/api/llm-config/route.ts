import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

// Store runtime LLM configuration
let runtimeConfig: {
  provider: 'anthropic' | 'ollama' | 'openai'
  model: string
  anthropicKey?: string
  openaiKey?: string
  ollamaUrl?: string
  temperature?: number
} | null = null

// Get current LLM configuration
export function getLLMConfig() {
  if (runtimeConfig) {
    return runtimeConfig
  }

  // Fallback to environment variables
  return {
    provider: (process.env.LLM_PROVIDER as any) || 'openai',
    model: process.env.LLM_MODEL || 'gpt-4o',
    anthropicKey: process.env.ANTHROPIC_API_KEY,
    openaiKey: process.env.OPENAI_API_KEY,
    ollamaUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    temperature: 0.7
  }
}

export async function POST(request: NextRequest) {
  try {
    const settings = await request.json()

    // Validate required fields
    if (!settings.provider || !settings.model) {
      return NextResponse.json(
        { error: 'Provider and model are required' },
        { status: 400 }
      )
    }

    // Validate provider-specific requirements
    // API keys come from .env.local, not from request body
    if (settings.provider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured in .env.local' },
        { status: 400 }
      )
    }

    if (settings.provider === 'openai' && !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured in .env.local' },
        { status: 400 }
      )
    }

    if (settings.provider === 'ollama' && !settings.ollamaUrl) {
      settings.ollamaUrl = 'http://localhost:11434'
    }

    // Update runtime configuration
    // Use API keys from environment variables, not from request
    runtimeConfig = {
      provider: settings.provider,
      model: settings.model,
      anthropicKey: process.env.ANTHROPIC_API_KEY,
      openaiKey: process.env.OPENAI_API_KEY,
      ollamaUrl: settings.ollamaUrl || 'http://localhost:11434',
      temperature: settings.temperature ?? 0.7
    }

    // Update .env.local for persistence (only provider, model, and ollama URL - NOT API keys)
    try {
      const envPath = join(process.cwd(), '.env.local')
      if (existsSync(envPath)) {
        let envContent = readFileSync(envPath, 'utf-8')

        // Update only non-sensitive configuration (not API keys)
        const updates: { [key: string]: string } = {
          LLM_PROVIDER: settings.provider,
          LLM_MODEL: settings.model
        }

        // Only update Ollama URL if using Ollama
        if (settings.provider === 'ollama') {
          updates.OLLAMA_BASE_URL = settings.ollamaUrl || 'http://localhost:11434'
        }

        // Update each variable in the env file
        Object.entries(updates).forEach(([key, value]) => {
          const regex = new RegExp(`^${key}=.*$`, 'm')
          if (regex.test(envContent)) {
            envContent = envContent.replace(regex, `${key}=${value}`)
          } else {
            envContent += `\n${key}=${value}`
          }
        })

        writeFileSync(envPath, envContent, 'utf-8')
        console.log('✅ Updated .env.local:', settings.provider, settings.model)
      }
    } catch (error) {
      console.error('Error updating .env.local:', error)
      // Continue even if .env update fails - runtime config is still updated
    }

    return NextResponse.json({
      success: true,
      message: 'LLM configuration updated successfully',
      config: {
        provider: runtimeConfig.provider,
        model: runtimeConfig.model,
        temperature: runtimeConfig.temperature
      }
    })

  } catch (error) {
    console.error('Error updating LLM config:', error)
    return NextResponse.json(
      { error: 'Failed to update LLM configuration' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve current configuration
export async function GET() {
  const config = getLLMConfig()

  return NextResponse.json({
    success: true,
    config: {
      provider: config.provider,
      model: config.model,
      ollamaUrl: config.ollamaUrl,
      temperature: config.temperature,
      // Don't expose API keys
      hasAnthropicKey: !!config.anthropicKey,
      hasOpenAIKey: !!config.openaiKey
    }
  })
}
