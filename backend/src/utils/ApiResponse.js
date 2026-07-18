/**
 * Standardized API Response wrapper.
 * Ensures uniform JSON response structure across the entire API.
 */
class ApiResponse {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Human-readable message
   * @param {*} data - Response payload
   * @param {object} meta - Pagination or extra metadata
   */
  constructor(statusCode, message, data = null, meta = null) {
    this.success = statusCode >= 200 && statusCode < 300;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    if (meta) this.meta = meta;
  }

  /**
   * Send the response through Express res object.
   * @param {import('express').Response} res
   */
  send(res) {
    return res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      data: this.data,
      ...(this.meta && { meta: this.meta }),
    });
  }

  // ── Factory Methods ──────────────────────────────────────

  static ok(res, message = 'Success', data = null, meta = null) {
    return new ApiResponse(200, message, data, meta).send(res);
  }

  static created(res, message = 'Created successfully', data = null) {
    return new ApiResponse(201, message, data).send(res);
  }

  static noContent(res, message = 'Deleted successfully') {
    return new ApiResponse(204, message).send(res);
  }

  /**
   * Paginated response helper.
   * @param {import('express').Response} res
   * @param {string} message
   * @param {Array} data
   * @param {{ page: number, limit: number, total: number }} pagination
   */
  static paginated(res, message, data, { page, limit, total }) {
    const totalPages = Math.ceil(total / limit);
    return new ApiResponse(200, message, data, {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    }).send(res);
  }
}

module.exports = ApiResponse;
