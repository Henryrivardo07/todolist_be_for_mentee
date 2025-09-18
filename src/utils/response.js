function successResponse(res, data = null, message = "Success", status = 200) {
  return res.status(status).json({ success: true, message, data });
}

function errorResponse(res, message = "Internal server error", status = 500) {
  return res.status(status).json({ success: false, message });
}

module.exports = { successResponse, errorResponse };
