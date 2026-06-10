"""Package a .usdc (+textures) as .usdz and validate ARKit compliance."""
import sys
from pxr import UsdUtils

src, dst = sys.argv[1], sys.argv[2]

ok = UsdUtils.CreateNewARKitUsdzPackage(src, dst)
if not ok:
    raise SystemExit(f"FAILED to package {src}")
print("PACKAGED", dst)

checker = UsdUtils.ComplianceChecker(arkit=True, verbose=False)
checker.CheckCompliance(dst)
errors = checker.GetErrors()
failed = checker.GetFailedChecks()
for e in errors:
    print("ERROR:", e)
for f in failed:
    print("FAILED CHECK:", f)
if not errors and not failed:
    print("COMPLIANCE: PASS")
