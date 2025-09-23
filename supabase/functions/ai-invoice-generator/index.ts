
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvoiceRequest {
  prompt: string;
  includeNotes?: boolean;
  customNotes?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, includeNotes = false, customNotes = '' }: InvoiceRequest = await req.json();
    
    console.log('Processing invoice generation request:', { prompt });

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `Extract invoice data from the prompt and return ONLY valid JSON with no explanations.

CRITICAL: Extract exact amounts, rates, percentages, currencies, and dates from the prompt.

EXTRACTION RULES:
- Currency amounts: Look for patterns like $X, PKR X, EUR X, USD X, etc. - use exact amount found
- Parse numbers with commas (350,000 = 350000)
- Currency codes: Detect PKR, USD, EUR, GBP, CAD, AUD, etc.
- Tax rates: Look for X% tax, X percent tax - use exact percentage
- Dates: Parse any date references (4Sep = September 4, 2025)
- Quantities: Look for hours, units, items
- Services: Infer from context (retainer, consulting, development, etc.)

RETURN ONLY THIS JSON:
{
  "client": {
    "name": "Client Company",
    "email": "contact@client.com",
    "address": "123 Business St, City, State 12345"
  },
  "items": [
    {
      "description": "Monthly Retainer",
      "quantity": 1,
      "rate": 750,
      "amount": 750
    }
  ],
  "subtotal": 750,
  "taxPercentage": 1,
  "tax": 7.5,
  "discountPercentage": 0,
  "discount": 0,
  "shipping": 0,
  "total": 757.5,
  "paymentTerms": 30,
  "notes": "Payment terms as agreed.",
  "currency": "USD"
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');
    
    let aiResponse = data.choices[0].message.content;
    console.log('Raw AI response:', aiResponse);
    
    // Clean the response - remove any markdown formatting or extra text
    aiResponse = aiResponse.trim();
    if (aiResponse.startsWith('```json')) {
      aiResponse = aiResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
    }
    if (aiResponse.startsWith('```')) {
      aiResponse = aiResponse.replace(/```\s*/, '').replace(/```\s*$/, '');
    }
    
    // Try to extract JSON if there's extra text
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      aiResponse = jsonMatch[0];
    }
    
    let parsedInvoiceData;
    
    // Check if AI response is empty or invalid
    if (!aiResponse || aiResponse.trim() === '' || aiResponse.trim() === 'null') {
      console.log('AI response is empty, using fallback parsing');
      parsedInvoiceData = null; // Force fallback
    } else {
      try {
        parsedInvoiceData = JSON.parse(aiResponse);
        console.log('Successfully parsed invoice data:', parsedInvoiceData);
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', aiResponse);
        console.error('Parse error:', parseError);
        parsedInvoiceData = null; // Force fallback
      }
    }
    
    // Use fallback logic if AI parsing failed
    if (!parsedInvoiceData) {
      // Fallback: Create invoice data from prompt analysis
      console.log('Creating fallback invoice data...');
      
      // Extract currency and amounts - look for various currency patterns
      let currency = "USD";
      let amount = 100;
      
      // Look for currency patterns like PKR 350,000 or $100 or USD 500
      const currencyPatterns = [
        /(?:PKR|Rs\.?)\s*([\d,]+(?:\.\d{2})?)/i,  // PKR 350,000 or Rs. 350,000
        /\$\s*([\d,]+(?:\.\d{2})?)/,              // $350,000
        /(USD|EUR|GBP|CAD|AUD)\s*([\d,]+(?:\.\d{2})?)/i, // USD 350000
        /([\d,]+(?:\.\d{2})?)\s*(PKR|USD|EUR|GBP|CAD|AUD)/i, // 350000 PKR
      ];
      
      for (const pattern of currencyPatterns) {
        const match = prompt.match(pattern);
        if (match) {
          if (pattern.source.includes('PKR|Rs')) {
            currency = "PKR";
            amount = parseFloat(match[1].replace(/,/g, ''));
          } else if (pattern.source.includes('\\$')) {
            currency = "USD";
            amount = parseFloat(match[1].replace(/,/g, ''));
          } else if (match[1] && match[2]) {
            // Currency code is in match[1] or match[2]
            const currencyCode = match[1].length <= 3 ? match[1].toUpperCase() : match[2].toUpperCase();
            const amountStr = match[1].length <= 3 ? match[2] : match[1];
            currency = currencyCode;
            amount = parseFloat(amountStr.replace(/,/g, ''));
          }
          break;
        }
      }
      
      // Extract tax percentage - look for X% pattern
      const taxMatch = prompt.match(/(\d+(?:\.\d+)?)\s*%/);
      const taxPercentage = taxMatch ? parseFloat(taxMatch[1]) : 8;
      
      // Extract date - look for date patterns like "4Sep", "Sept 4", "September 4"
      const dateMatch = prompt.match(/(\d{1,2})\s*(sep|sept|september|oct|october|nov|november|dec|december|jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august)/i);
      let dueDate = new Date();
      if (dateMatch) {
        const day = parseInt(dateMatch[1]);
        const monthStr = dateMatch[2].toLowerCase();
        const monthMap: { [key: string]: number } = {
          'jan': 0, 'january': 0, 'feb': 1, 'february': 1, 'mar': 2, 'march': 2,
          'apr': 3, 'april': 3, 'may': 4, 'jun': 5, 'june': 5,
          'jul': 6, 'july': 6, 'aug': 7, 'august': 7, 'sep': 8, 'sept': 8, 'september': 8,
          'oct': 9, 'october': 9, 'nov': 10, 'november': 10, 'dec': 11, 'december': 11
        };
        const month = monthMap[monthStr] ?? 8; // default to September if not found
        dueDate = new Date(2025, month, day);
      } else {
        dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      }
      
      // Extract client info - avoid matching currency codes as client names
      const emailMatch = prompt.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      
      // Look for client/company patterns but exclude currency codes
      let clientName = "Client Company";
      const clientPatterns = [
        /(?:for|client:|company:)\s*([A-Za-z0-9\s&.,'-]+?)(?=\s*(?:PKR|USD|EUR|GBP|\$|\d+|$|,|\.|\s*Email:|\s*email:))/i,
        /(?:invoice for|bill to|client)\s*([A-Za-z0-9\s&.,'-]+?)(?=\s*(?:PKR|USD|EUR|GBP|\$|\d+|$|,|\.|\s*Email:|\s*email:))/i
      ];
      
      for (const pattern of clientPatterns) {
        const match = prompt.match(pattern);
        if (match && match[1]) {
          const name = match[1].trim();
          // Make sure it's not a currency code
          if (name.length > 3 && !['PKR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD'].includes(name.toUpperCase())) {
            clientName = name;
            break;
          }
        }
      }
      
      // Calculate tax and total
      const tax = amount * (taxPercentage / 100);
      const total = amount + tax;
      
      // Determine service description
      const promptLower = prompt.toLowerCase();
      let description = "Professional Services";
      if (promptLower.includes('retainer')) description = "Monthly Retainer";
      else if (promptLower.includes('consulting')) description = "Consulting Services";
      else if (promptLower.includes('web') || promptLower.includes('development')) description = "Web Development Services";
      else if (promptLower.includes('design')) description = "Design Services";
      
      parsedInvoiceData = {
        client: {
          name: clientName,
          email: emailMatch ? emailMatch[0] : "contact@client.com",
          address: "123 Business St, City, State 12345"
        },
        items: [{
          description,
          quantity: 1,
          rate: amount,
          amount: amount
        }],
        subtotal: amount,
        taxPercentage: taxPercentage,
        tax: tax,
        discountPercentage: 0,
        discount: 0,
        shipping: 0,
        total: total,
        paymentTerms: 30,
        notes: "Payment due within terms.",
        currency: currency,
        customDueDate: dueDate.toISOString().split('T')[0]
      };
      
      console.log('Generated fallback invoice data:', parsedInvoiceData);
    }

    // Generate invoice number and dates
    const invoiceNumber = `AI-${Date.now().toString().slice(-6)}`;
    const today = new Date();
    
    // Use custom due date if provided, otherwise calculate from payment terms
    let finalDueDate;
    if (parsedInvoiceData.customDueDate) {
      finalDueDate = parsedInvoiceData.customDueDate;
    } else {
      // Parse payment terms - extract number from string like "30 days" or use default
      let paymentTermsDays = 30;
      if (parsedInvoiceData.paymentTerms) {
        const match = parsedInvoiceData.paymentTerms.toString().match(/\d+/);
        if (match) {
          paymentTermsDays = parseInt(match[0]);
        }
      }
      const calculatedDueDate = new Date(today.getTime() + paymentTermsDays * 24 * 60 * 60 * 1000);
      finalDueDate = calculatedDueDate.toISOString().split('T')[0];
    }

    // Structure the final invoice data with proper number conversion
    const invoiceData = {
      invoiceNumber,
      date: today.toISOString().split('T')[0],
      dueDate: finalDueDate,
      client: parsedInvoiceData.client,
      items: parsedInvoiceData.items.map((item: any) => ({
        ...item,
        quantity: parseFloat(item.quantity) || 0,
        rate: parseFloat(item.rate) || 0,
        amount: parseFloat(item.amount) || 0
      })),
      subtotal: parseFloat(parsedInvoiceData.subtotal) || 0,
      taxPercentage: parseFloat(parsedInvoiceData.taxPercentage) || 0,
      tax: parseFloat(parsedInvoiceData.tax) || 0,
      discountPercentage: parseFloat(parsedInvoiceData.discountPercentage) || 0,
      discount: parseFloat(parsedInvoiceData.discount) || 0,
      shipping: parseFloat(parsedInvoiceData.shipping) || 0,
      total: parseFloat(parsedInvoiceData.total) || 0,
      currency: parsedInvoiceData.currency || 'USD',
      notes: parsedInvoiceData.notes || (includeNotes ? `Generated from AI prompt: "${prompt.slice(0, 100)}${prompt.length > 100 ? '...' : ''}'"` : customNotes || '')
    };

    console.log('Generated invoice data:', invoiceData);

    return new Response(JSON.stringify(invoiceData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in ai-invoice-generator function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate invoice',
        details: error.toString()
      }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
