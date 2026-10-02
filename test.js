fetch('http://localhost:3000/api/backup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: 'C:/test-backup', filename: 'test.json', content: '{"hello":"world"}' })
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));
