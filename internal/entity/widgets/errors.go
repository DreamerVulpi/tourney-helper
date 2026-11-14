package widget

import "errors"

// ErrExternalService marks failures that come from an external tournament
// platform (for example start.gg is unreachable, timed out, rate limited or
// responded with a server error). Such failures are not caused by the
// application itself and should be shown to the user as an external error.
var ErrExternalService = errors.New("external tournament service error")
