import express from 'express';
import { ToolsService, tool, ParameterType } from '@optimizely-opal/opal-tools-sdk';

// Create Express app
const app = express();
app.use(express.json());

// Create Tools Service
const toolsService = new ToolsService(app);

// Interfaces for tool parameters
interface GreetingParameters {
  name: string;
  language?: string;
}

interface DateParameters {
  format?: string;
}

/**
 * Greeting Tool: Greets a person in a random language
 */
// Apply tool decorator after function definition
async function greeting(parameters: GreetingParameters) {
  const { name, language } = parameters;
  
  // If language not specified, choose randomly
  const selectedLanguage = language || 
    ['english', 'spanish', 'french'][Math.floor(Math.random() * 3)];
  
  // Generate greeting based on language
  let greeting: string;
  if (selectedLanguage.toLowerCase() === 'spanish') {
    greeting = `¡Hola, ${name}! ¿Cómo estás?`;
  } else if (selectedLanguage.toLowerCase() === 'french') {
    greeting = `Bonjour, ${name}! Comment ça va?`;
  } else { // Default to English
    greeting = `Hello, ${name}! How are you?`;
  }
  
  return {
    greeting,
    language: selectedLanguage
  };
}

/**
 * Today's Date Tool: Returns today's date in the specified format
 */
// Apply tool decorator after function definition
async function todaysDate(parameters: DateParameters) {
  const format = parameters.format || '%Y-%m-%d';
  
  // Get today's date
  const today = new Date();
  
  // Format the date (simplified implementation)
  let formattedDate: string;
  if (format === '%Y-%m-%d') {
    formattedDate = today.toISOString().split('T')[0];
  } else if (format === '%B %d, %Y') {
    formattedDate = today.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } else if (format === '%d/%m/%Y') {
    formattedDate = today.toLocaleDateString('en-GB');
  } else {
    // Default to ISO format
    formattedDate = today.toISOString().split('T')[0];
  }
  
  return {
    date: formattedDate,
    format: format,
    timestamp: today.getTime() / 1000
  };
}

async function assessPageTitleForSEO(parameters: { url: string }) {
  const { url } = parameters;
  
  const response = await fetch(url);
  const html = await response.text();
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  
  const title = titleMatch ? titleMatch[1] : 'No title found';

  const heuristics = [
    { description: 'Title is present', isValid: !!title },
    { description: 'Title is not too short', isValid: title.length > 10 },
    { description: 'Title is not too long', isValid: title.length < 60 }
  ];
  
  const assessment = heuristics.map(h => ({
    description: h.description,
    isValid: h.isValid
  }));

  const overallAssessment = {
    isValid: heuristics.every(h => h.isValid),
    details: assessment
  };

  return {
    url,
    title,
    overallAssessment
  };
}

// Register the tools using decorators with explicit parameter definitions
tool({
  name: 'greeting',
  description: 'Greets a person in a random language (English, Spanish, or French)',
  parameters: [
    {
      name: 'name',
      type: ParameterType.String,
      description: 'Name of the person to greet',
      required: true
    },
    {
      name: 'language',
      type: ParameterType.String,
      description: 'Language for greeting (defaults to random)',
      required: false
    }
  ]
})(greeting);

tool({
  name: 'todays-date',
  description: 'Returns today\'s date in the specified format',
  parameters: [
    {
      name: 'format',
      type: ParameterType.String,
      description: 'Date format (defaults to ISO format)',
      required: false
    }
  ]
})(todaysDate);

tool({
  name: 'assess-page-title-for-seo',
  description: 'Assesses the page title of a given URL for SEO best practices',
  parameters: [
    {
      name: 'url',
      type: ParameterType.String,
      description: 'The URL of the webpage to assess',
      required: true
    }
  ]
})(assessPageTitleForSEO);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Discovery endpoint: http://localhost:${PORT}/discovery`);
});
