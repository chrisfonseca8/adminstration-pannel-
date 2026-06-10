import redis from '../src/config/redis.js';
import { TTL } from '../utils/common/extra.js';
import { rebuildSession } from '../services/session_service/session.js';

const sessionMiddleware = async (req, res, next) => {
    console.log('session middleware is running ')
    try {
        const sessionId = req.cookies?.Host_session;
        console.log(`sessionId:${sessionId}`)
        if (!sessionId) return next();

        const raw = await redis.get(`sessionId:${sessionId}`);
        if (!raw) return next();

        const session = JSON.parse(raw);
        const isStale = await redis.get(`stale:user:${session.user_id}`);
        console.log(`isStale:user:${session.user_id}:${isStale}`)

        if (isStale) {
            const freshSession = await rebuildSession(session.user_id);
            await redis.set(
                `sessionId:${sessionId}`,
                JSON.stringify(freshSession),
                'EX',
                TTL
            );
            await redis.del(`stale:user:${session.user_id}`);
            req.session = freshSession;
        } else {
            req.session = session;
            await redis.expire(`sessionId:${sessionId}`, TTL);
        }

        return next();
    } catch (error) {
        return next(error);
    }
};

export default sessionMiddleware;
