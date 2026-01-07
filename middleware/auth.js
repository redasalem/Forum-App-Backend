const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No authentication token, access denied",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if token was issued before the most recent logout
    if (user.lastLogout) {
      const issuedAt = decoded.iat * 1000;
      const lastLogoutAt = user.lastLogout.getTime();

      console.log(`[Auth Middleware] User: ${user.email}`);
      console.log(
        `[Auth Middleware] Token Issued At: ${new Date(issuedAt).toISOString()}`
      );
      console.log(
        `[Auth Middleware] Last Logout At: ${user.lastLogout.toISOString()}`
      );

      if (issuedAt < lastLogoutAt) {
        console.log(
          "[Auth Middleware] ❌ Token invalidated due to recent logout"
        );
        return res.status(401).json({
          success: false,
          message: "Session expired, please login again",
        });
      }
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error during authentication",
    });
  }
};

// Optional auth - doesn't fail if no token, just sets user if available
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user) {
        req.user = user;
        req.userId = user._id;
      }
    }

    next();
  } catch (error) {
    // Continue without user
    next();
  }
};

module.exports = { auth, optionalAuth };
