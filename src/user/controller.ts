import { Elysia, t } from 'elysia'
import { userPostHandler } from './handlers';

export const user = new Elysia({ prefix: '/users' })
    .post('/', userPostHandler);
