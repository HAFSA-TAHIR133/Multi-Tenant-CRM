import DashboardService from '../services/dashboard.service.js';
import { httpResponse } from '../utils/httpResponse.js';
import { ErrorCodesMeta } from '../constants/error-codes.js';

const handleDashboardError = (res, error) => {
  if (error.code === ErrorCodesMeta.NOT_FOUND.code) {
    return httpResponse.NOT_FOUND(res, {}, error.message);
  }

  if (error.code === ErrorCodesMeta.FORBIDDEN.code) {
    return httpResponse.FORBIDDEN(res, {}, error.message);
  }

  return httpResponse.INTERNAL_SERVER_ERROR(
    res,
    {},
    error.message || ErrorCodesMeta.INTERNAL_SERVER_ERROR.message
  );
};

class DashboardController {
  getStats = async (req, res) => {
    try {
      const result = await DashboardService.getStats(req.user);
      return httpResponse.SUCCESS(res, result);
    } catch (error) {
      return handleDashboardError(res, error);
    }
  };

  getRecentUsers = async (req, res) => {
    try {
      const result = await DashboardService.getRecentUsers(req.user);
      return httpResponse.SUCCESS(res, result);
    } catch (error) {
      return handleDashboardError(res, error);
    }
  };

  getRecentTenants = async (req, res) => {
    try {
      const result = await DashboardService.getRecentTenants(req.user);
      return httpResponse.SUCCESS(res, result);
    } catch (error) {
      return handleDashboardError(res, error);
    }
  };

  getTenantsChart = async (req, res) => {
    try {
      const result = await DashboardService.getTenantsChart(req.user, req.query);
      return httpResponse.SUCCESS(res, result);
    } catch (error) {
      return handleDashboardError(res, error);
    }
  };

  getTenantStatusChart = async (req, res) => {
    try {
      const result = await DashboardService.getTenantStatusChart(req.user);
      return httpResponse.SUCCESS(res, result);
    } catch (error) {
      return handleDashboardError(res, error);
    }
  };

  getAdminStats = async (req, res) => {
    try {
      const result = await DashboardService.getAdminStats(req.user);
      return httpResponse.SUCCESS(res, result);
    } catch (error) {
      return handleDashboardError(res, error);
    }
  };

  getAdminLineChart = async (req, res) => {
    try {
      const result = await DashboardService.getAdminLineChart(req.user, req.query);
      return httpResponse.SUCCESS(res, result);
    } catch (error) {
      return handleDashboardError(res, error);
    }
  };

  getAdminStatusChart = async (req, res) => {
    try {
      const result = await DashboardService.getAdminStatusChart(req.user);
      return httpResponse.SUCCESS(res, result);
    } catch (error) {
      return handleDashboardError(res, error);
    }
  };

  getUserStats = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: User not authenticated' });
    }
    const result = await DashboardService.getUserStats(req.user);
    return httpResponse.SUCCESS(res, result);
  } catch (error) {
    return handleDashboardError(res, error);
  }
};

getUserLineChart = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: User not authenticated' });
    }
    const result = await DashboardService.getUserLineChart(req.user, req.query);
    return httpResponse.SUCCESS(res, result);
  } catch (error) {
    return handleDashboardError(res, error);
  }
};

getUserStatusChart = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: User not authenticated' });
    }
    const result = await DashboardService.getUserStatusChart(req.user);
    return httpResponse.SUCCESS(res, result);
  } catch (error) {
    return handleDashboardError(res, error);
  }
};
}

export default new DashboardController();