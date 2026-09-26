# TAPSAKAY Mock Prototype

**Tap. Match. Sakay.** A frontend-only Expo demo of one passenger ride and its driver view. All data and notifications stay in memory; there is no server, authentication, GPS, or cross-device sync.

## Run

```bash
pnpm install
pnpm start
```

Open the Expo app on a device, simulator, or press `w` for web. The welcome screen appears on each launch; choose Passenger or Driver to enter the demo. Both modes remain available through the switch in the header. Reloading starts a fresh demo.

## Demo walkthrough

1. In Passenger → Book, select **CBM → Market** and **2 passengers**, then request a ride.
2. After the short matching delay, **Rela #01** appears. Switch to Driver → Requests and accept.
3. At CBM, confirm pickup. Driver occupancy changes from **5/8 to 7/8**.
4. Advance the driver through CMU Gate, Hospital, and Market. Confirm drop-off at Market. Occupancy returns to **5/8**.
5. Switch to Passenger → Trips to see completion. Driver → Menu has **Reset demo** and guarded force-step controls.

The route has five stations and three mock relas. Matching uses the first online rela that has enough free seats and has not passed the pickup. Only one ride can be active at a time.

## Checks

```bash
pnpm typecheck
pnpm test
```
