import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join('C:', 'Users', 'Denny', 'ai-training-center', 'data', 'business-units')

// Ensure directory exists
function ensureDirectoryExists(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { businessUnit, dataType, data } = await request.json()

    if (!businessUnit || !dataType) {
      return NextResponse.json(
        { error: 'Business unit and data type are required' },
        { status: 400 }
      )
    }

    // Create business unit directory if it doesn't exist
    const businessUnitDir = path.join(DATA_DIR, businessUnit)
    ensureDirectoryExists(businessUnitDir)

    // Write data to file
    const filePath = path.join(businessUnitDir, `${dataType}.json`)
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')

    return NextResponse.json({
      success: true,
      message: `${dataType} saved for ${businessUnit}`,
      path: filePath
    })
  } catch (error) {
    console.error('Data sync save error:', error)
    return NextResponse.json(
      { error: 'Failed to save data to file' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessUnit = searchParams.get('businessUnit')
    const dataType = searchParams.get('dataType')

    if (!businessUnit || !dataType) {
      return NextResponse.json(
        { error: 'Business unit and data type are required' },
        { status: 400 }
      )
    }

    const filePath = path.join(DATA_DIR, businessUnit, `${dataType}.json`)

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'File does not exist yet'
      })
    }

    // Read and parse the file
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const data = JSON.parse(fileContent)

    return NextResponse.json({
      success: true,
      data: data
    })
  } catch (error) {
    console.error('Data sync load error:', error)
    return NextResponse.json(
      { error: 'Failed to load data from file' },
      { status: 500 }
    )
  }
}

// DELETE endpoint to remove business unit data
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessUnit = searchParams.get('businessUnit')

    if (!businessUnit) {
      return NextResponse.json(
        { error: 'Business unit is required' },
        { status: 400 }
      )
    }

    // Don't allow deleting skincoach
    if (businessUnit === 'skincoach') {
      return NextResponse.json(
        { error: 'Cannot delete default skincoach business unit' },
        { status: 403 }
      )
    }

    const businessUnitDir = path.join(DATA_DIR, businessUnit)

    // Check if directory exists
    if (fs.existsSync(businessUnitDir)) {
      // Remove the entire directory
      fs.rmSync(businessUnitDir, { recursive: true, force: true })
    }

    return NextResponse.json({
      success: true,
      message: `Business unit ${businessUnit} data deleted`
    })
  } catch (error) {
    console.error('Data sync delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete business unit data' },
      { status: 500 }
    )
  }
}
