import { AuthService } from '../services/index.js';
import { ErrorCodesMeta, SuccessCodesMeta, UserRole } from '../constants/index.js';
import { httpResponse } from '../utils/httpResponse.js';


class AuthController {
  async createUser(req, res) {
    try {
      const creator = req.user; // from authMiddleware after verify the user access level
      const userData = req.body;

      const user = await AuthService.createUser(userData, creator);

      return httpResponse.CREATED(res, {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      });
    } 
	catch (error) {
      console.error('Create user error:', error);

      if (error.code === ErrorCodesMeta.USER_ALREADY_EXISTS.code) {
        return httpResponse.BAD_REQUEST(
          res,
          {},
          ErrorCodesMeta.USER_ALREADY_EXISTS.message
        );
      }

      return httpResponse.BAD_REQUEST(res, {}, error.message || 'Failed to create user');
    }
  }

   async login(req, res) {
  try {
    const { email, password } = req.body;

    const result = await AuthService.login(email, password);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/v1/auth/refresh",
    });

    return httpResponse.SUCCESS(res, {
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (error) {
    if (error.code === ErrorCodesMeta.UNAUTHORIZED.code) {
      return httpResponse.UNAUTHORIZED(res, {}, error.message);
    }

    return httpResponse.BAD_REQUEST(
      res,
      {},
      error.message || ErrorCodesMeta.BAD_REQUEST.message
    );
  }
}

  async refreshAccessToken(req, res) {
  try {
    console.log("COOKIE:");
    console.log(req.cookies);
    const refreshToken = req.cookies?.refreshToken;
    

    if (!refreshToken) {
      const err = new Error("Refresh token required");
      err.code = ErrorCodesMeta.UNAUTHORIZED.code;
      throw err;
    }

    const result = await AuthService.refreshToken(refreshToken);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/v1/auth/refresh",
    });
    

    return httpResponse.SUCCESS(res, {
      accessToken: result.accessToken,
    });

  } catch (error) {

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/v1/auth/refresh",
    });

    if (error.code === ErrorCodesMeta.UNAUTHORIZED.code) {
      return httpResponse.UNAUTHORIZED(res, {}, error.message);
    }

    return httpResponse.BAD_REQUEST(
      res,
      {},
      error.message || ErrorCodesMeta.BAD_REQUEST.message
    );
  }
}

  async logout(req, res) {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      await AuthService.logout(refreshToken);
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/v1/auth/refresh",
    });

    return httpResponse.SUCCESS(res, {
      message: "Logged out successfully",
    });

  } catch (error) {

    return httpResponse.BAD_REQUEST(
      res,
      {},
      error.message || ErrorCodesMeta.BAD_REQUEST.message
    );
  }
}

  async logoutAll(req, res) {
    try {
      const userId = req.user.userId;
      const result = await AuthService.logoutAll(userId);

      return httpResponse.SUCCESS(res, result);
    } 
	catch (error) {
      console.error('Logout all error:', error);
      return httpResponse.BAD_REQUEST(
        res,
        {},
        error.message || ErrorCodesMeta.BAD_REQUEST.message
      );
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const result = await AuthService.forgotPassword(email);

      return httpResponse.SUCCESS(res, result);
    } 
	catch (error) {
      console.error('Forgot password error:', error);
      return httpResponse.BAD_REQUEST(
        res,
        {},
        error.message || ErrorCodesMeta.BAD_REQUEST.message
      );
    }
  }

  async resetPassword(req, res) {
    try {
      const { token, password } = req.body;
      const result = await AuthService.resetPassword(token, password);

      return httpResponse.SUCCESS(res, result);
    } 
	catch (error) {
      console.error('Reset password error:', error);
      return httpResponse.BAD_REQUEST(
        res,
        {},
        error.message || ErrorCodesMeta.BAD_REQUEST.message
      );
    }
  }
}

export default new AuthController();