import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientProfileId, medicalRecordId, services } = body;

    // Validate required fields (doctorId removed since it comes from token)
    if (!patientProfileId || !medicalRecordId || !services || !Array.isArray(services)) {
      return NextResponse.json(
        { error: 'Missing required fields: patientProfileId, medicalRecordId, services' },
        { status: 400 }
      );
    }

    // Forward the request to the backend service
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    const response = await fetch(`${backendUrl}/prescriptions`, {
      method: 'POST',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        patientProfileId,
        medicalRecordId,
        services,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || 'Backend service error' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Create prescription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
