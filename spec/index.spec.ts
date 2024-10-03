import Fastify from 'fastify';
import supertest from 'supertest';
import {jest,describe,afterAll,beforeAll,it,expect,mock} from 'bun:test'
import { getDataBase } from '../src/database'; // Adjust the path to your database function
import { randomUUID } from 'crypto';
import app from '../src/app'; // Adjust to where you are exporting your Fastify app

// Mocking the database
mock('../src/database');

describe('POST /blocks', () => {
  let fastify: any;

  beforeAll(async () => {
    fastify = Fastify();
    await fastify.register(app); // Assuming you're exporting Fastify instance from app
    await fastify.ready();
  });

  afterAll(() => {
    fastify.close();
  });

  it('should return success for valid blocks', async () => {
    // Mocking the pool.query to resolve for successful insert
    const mockQuery = jest.fn().mockResolvedValue({ rowCount: 1 });
    getDataBase.mockReturnValue({ query: mockQuery });

    const blocks = [
      {
        height: 1,
        transactions: [
          {
            id: 'tx1',
            inputs: [],
            outputs: [{ address: 'addr1', value: 10 }]
          }
        ]
      }
    ];

    const response = await supertest(fastify.server)
      .post('/blocks')
      .send(blocks)
      .expect(200); // Assuming success status is 200

    // Expectations
    expect(response.body.status).toBe('success');
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockQuery).toHaveBeenCalledWith(
      'INSERT INTO blocks(id,height,transactions) VALUES($1, $2, $3);',
      [expect.any(String), 1, JSON.stringify(blocks[0].transactions)]
    );
  });

});
