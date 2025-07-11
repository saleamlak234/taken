const AdminRole = require('../models/AdminRole');

const adminAuthMiddleware = (requiredPermissions = []) => {
  return async (req, res, next) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
      }

      const adminRole = await AdminRole.findOne({ user: req.user._id });
      
      if (!adminRole || !adminRole.isActive) {
        return res.status(403).json({ message: 'Admin role not found or inactive.' });
      }

      // if (adminRole.isLocked()) {
      //   return res.status(423).json({ 
      //     message: 'Account is locked due to multiple failed login attempts.' 
      //   });
      // }

      // Check permissions
      if (requiredPermissions.length > 0) {
        const hasPermission = requiredPermissions.some(permission => 
          adminRole.permissions.includes(permission)
        );

        if (!hasPermission) {
          return res.status(403).json({ 
            message: 'Insufficient permissions for this operation.' 
          });
        }
      }

      req.adminRole = adminRole;
      next();
    } catch (error) {
      console.error('Admin auth middleware error:', error);
      res.status(500).json({ message: 'Server error in admin authentication' });
    }
  };
};

module.exports = adminAuthMiddleware;