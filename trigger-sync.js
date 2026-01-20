import fetch from 'node-fetch';

console.log('🔄 Triggering Wikidata sync...\n');

try {
  const response = await fetch('http://localhost:3001/api/admin/sync-wikidata', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  
  console.log('✅ Sync Response:');
  console.log(JSON.stringify(data, null, 2));
  
  if (data.success) {
    console.log(`\n🎉 Successfully synced ${data.data.playersAdded} new players!`);
    console.log(`📊 Total players updated: ${data.data.playersUpdated}`);
  }
} catch (error) {
  console.error('❌ Error triggering sync:', error.message);
  process.exit(1);
}
