const mongoose = require('mongoose');
const Reel = require('../src/models/Reel');
const { publishScheduledReels } = require('../src/jobs/reelScheduler');

describe('Reel Scheduler Unit Tests', () => {
  let findSpy;
  let updateManySpy;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should publish pending scheduled reels whose time has passed', async () => {
    const mockReels = [
      { _id: new mongoose.Types.ObjectId(), status: 'scheduled', scheduledDate: new Date(Date.now() - 5000) }
    ];

    findSpy = jest.spyOn(Reel, 'find').mockResolvedValue(mockReels);
    updateManySpy = jest.spyOn(Reel, 'updateMany').mockResolvedValue({ acknowledged: true, modifiedCount: 1 });

    await publishScheduledReels();

    expect(findSpy).toHaveBeenCalledWith(expect.objectContaining({
      status: 'scheduled',
      scheduledDate: { $lte: expect.any(Date) }
    }));
    
    expect(updateManySpy).toHaveBeenCalledWith(
      { _id: { $in: [mockReels[0]._id] } },
      { $set: { status: 'published' } }
    );
  });

  it('should not publish anything if no pending scheduled reels exist', async () => {
    findSpy = jest.spyOn(Reel, 'find').mockResolvedValue([]);
    updateManySpy = jest.spyOn(Reel, 'updateMany');

    await publishScheduledReels();

    expect(findSpy).toHaveBeenCalled();
    expect(updateManySpy).not.toHaveBeenCalled();
  });
});
