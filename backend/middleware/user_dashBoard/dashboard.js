import redis from "../../src/config/redis.js";

export const check_user_middleware = async (req, res, next) => {
    try {
        const session_id = req.cookies.Host_session;

        if (!session_id) {
            return res.status(401).json({
                message: "No session cookie found"
            });
        }

        const sessionData = await redis.get(
            `sessionId:${session_id}`
        );

        if (!sessionData) {
            return res.status(401).json({
                message: "Invalid session"
            });
        }

        req.session = JSON.parse(sessionData);

        next();
    } catch (error) {
        return res.status(500).json({
            message: "Server error"
        });
    }
};