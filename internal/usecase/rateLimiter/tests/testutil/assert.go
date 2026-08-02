package testutil

import (
	"reflect"
	"testing"
)

func RequireNoError(t *testing.T, err error) {
	t.Helper()

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func RequireError(t *testing.T, err error) {
	t.Helper()

	if err == nil {
		t.Fatal("expected error, got nil")
	}
}

func RequireEqual(
	t *testing.T,
	expected any,
	actual any,
) {
	t.Helper()

	if !reflect.DeepEqual(expected, actual) {
		t.Fatalf(
			"expected: %#v, got: %#v",
			expected,
			actual,
		)
	}
}

func RequireNotEqual[T comparable](t *testing.T, want, got T) {
	t.Helper()

	if want == got {
		t.Fatalf("did not expect %v", got)
	}
}

func RequireTrue(t *testing.T, value bool) {
	t.Helper()

	if !value {
		t.Fatal("expected true")
	}
}

func RequireFalse(t *testing.T, value bool) {
	t.Helper()

	if value {
		t.Fatal("expected false")
	}
}

func RequireNil(t *testing.T, value any) {
	t.Helper()

	if !isNil(value) {
		t.Fatalf("expected nil, got %#v", value)
	}
}

func RequireNotNil(t *testing.T, value any) {
	t.Helper()

	if isNil(value) {
		t.Fatal("expected non-nil value")
	}
}

func isNil(value any) bool {
	if value == nil {
		return true
	}

	v := reflect.ValueOf(value)

	switch v.Kind() {
	case reflect.Chan,
		reflect.Func,
		reflect.Interface,
		reflect.Map,
		reflect.Pointer,
		reflect.Slice:
		return v.IsNil()
	default:
		return false
	}
}

func RequireEmpty[T any](t *testing.T, values []T) {
	t.Helper()

	if len(values) != 0 {
		t.Fatalf("expected empty slice, got %d elements", len(values))
	}
}

func RequireNotEmpty[T any](t *testing.T, values []T) {
	t.Helper()

	if len(values) == 0 {
		t.Fatal("expected non-empty slice")
	}
}
