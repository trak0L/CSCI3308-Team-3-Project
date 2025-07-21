const chai = require('chai');
const request = require('supertest');
const app = require('../../src/index.js');
const db = require('../../src/db.js');

const { expect } = chai;

describe('Message Board Integration', function() {
  this.timeout(5000);
  let agent;
  const testUser = {
    username: 'test123',
    email: 'test123@example.com',
    password: 'passwd',
    confirmPassword: 'passwd'
  };

  before(async () => {
    // reset DB
    await db.query('DELETE FROM comments');
    await db.query('DELETE FROM posts');
    await db.query('DELETE FROM boards');
    await db.query('DELETE FROM users');
    agent = request.agent(app);
  });

  after(async () => {
    await db.end();
  });

  it('registers a new user', async () => {
    const res = await agent
      .post('/register')
      .type('form')
      .send(testUser);
    expect(res.status).to.equal(302);
    expect(res.header.location).to.equal('/login');
  });

  it('logs in with the new user', async () => {
    const res = await agent
      .post('/login')
      .type('form')
      .send({
        username: testUser.username,
        password: testUser.password
      });
    expect(res.status).to.equal(302);
    expect(res.header.location).to.equal('/home');
    // no manual cookie capture needed
  });

  it('shows empty boards list on /home', async () => {
    const res = await agent
      .get('/home'); // agent will send the session cookie
    expect(res.status).to.equal(200);
    expect(res.text).to.not.include('<a href="/board?board_id=');
  });

  it('creates a new board', async () => {
    const res = await agent
      .post('/board')
      .type('form')
      .send({
        board_name: 'Integration',
        board_description: 'Test board'
      });
    expect(res.status).to.equal(302);
    expect(res.header.location).to.equal('/home');
  });

  it('lists the new board on /home', async () => {
    const res = await agent.get('/home');
    expect(res.status).to.equal(200);
    expect(res.text).to.include('Integration');
  });
});