import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClientRequest {
  prompt: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt }: ClientRequest = await req.json();

    const systemPrompt = `You are an AI assistant that generates client data in JSON format based on user prompts. 

Extract relevant information from the user's prompt and generate a JSON object with client details. If information is not provided, leave fields empty or use reasonable defaults.

Guidelines:
- If the prompt mentions a company/business, set client_type to "organizational"
- If it mentions an individual person, set client_type to "individual"  
- Extract names, locations, industries, contact details from the prompt
- Generate realistic but fake email/phone if not provided
- Be creative but professional with missing details
- Always include required fields for the client type

Return ONLY a valid JSON object with these fields:
{
  "client_type": "individual" | "organizational",
  "first_name": "string (for individual)",
  "last_name": "string (for individual)", 
  "name": "string (for organizational)",
  "company": "string",
  "email": "string",
  "phone": "string",
  "address": "string",
  "city": "string",
  "state": "string",
  "zip_code": "string",
  "country": "string",
  "industry": "string",
  "website": "string",
  "contact_person": "string (for organizational)",
  "contact_person_email": "string (for organizational)",
  "contact_person_phone": "string (for organizational)",
  "job_title": "string (for individual)",
  "notes": "string"
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    let clientData;

    try {
      clientData = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      throw new Error('Invalid JSON response from AI');
    }

    // Ensure required fields are present
    if (clientData.client_type === 'individual') {
      if (!clientData.first_name) clientData.first_name = 'John';
      if (!clientData.last_name) clientData.last_name = 'Doe';
    } else {
      if (!clientData.name) clientData.name = 'New Company';
    }

    return new Response(JSON.stringify({ clientData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-client-generator function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate client data',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});