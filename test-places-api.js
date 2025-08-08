const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const testPlaceId = 'ChIJKWPVigJ8hYAR9xgiFqxtv2g';
const apiKey = process.env.GOOGLE_MAPS_API_KEY;

const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${testPlaceId}&fields=name,website,formatted_phone_number&key=${apiKey}`;

console.log('Testing Google Places API...');
console.log('API Key present:', !!apiKey);
console.log('Place ID:', testPlaceId);
console.log('URL:', url);

axios.get(url).then(response => {
  console.log('Response Status:', response.status);
  console.log('Response Data:', JSON.stringify(response.data, null, 2));
}).catch(error => {
  console.log('Error:', error.message);
  if (error.response) {
    console.log('Error Status:', error.response.status);
    console.log('Error Data:', error.response.data);
  }
});