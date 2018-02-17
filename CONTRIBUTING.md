# Contributing to QmlWeb

This document describes both filing issues and contributing pull requests to
QmlWeb.
[![Join the chat at https://gitter.im/qmlweb/qmlweb](https://badges.gitter.im/qmlweb/qmlweb.svg)](https://gitter.im/qmlweb/qmlweb)

* [Filing issues](#filing-issues)

  * [«My code does not work»](#my-code-does-not-work)
  * [Elements issues](#elements-issues)
  * [Core/Engine issues](#core-engine-issues)
  * [Documentation/Testcases/Wishlist/other issues](#documentationtestcaseswishlistother-issues)
  * [Questions](#questions)

* [Fixing bugs](#fixing-bugs)
* [Implementing elements](#implementing-elements)

  * [Writing stubs](#writing-stubs)
  * [Writing actual implementation](#writing-actual-implementation)

* [Writing tests](#writing-tests)

  * [QtTest-based tests](#qttest-based-tests)
  * [Render tests](#render-tests)
  * [Initialization tests](#initialization-tests)
  * [Manual tests](#manual-tests)
  * [Failing tests](#failing-tests)

* [Code maintenance and cleanup](#code-maintenance-and-cleanup)
* [Documentation](#documentation)

## Filing issues

First of all, build QmlWeb from the `master` branch and ensure that the problem
is observable there. If it is not — just wait for the next QmlWeb release.

A snapshot of `master` branch could also be downloaded from GitHub as an
[archive](https://github.com/qmlweb/qmlweb/archive/master.zip).

Building requires [Node.js](https://nodejs.org) with npm, and is done by
executing `npm install && npm run build`.

If the problem is still observable — continue according to the categories below.

_Also take a minute to consider if that issue is already filed, if it is — don't
file a duplicate :wink:. If you didn't find an issue identical to yours or not
sure — it will be fine even if it will turn out to be a duplicate, though._

### «My code does not work»

Don't submit issues of this kind as-is. Do either one of the following:

1. Break it down to a problem with a single QML element, then see
   [Elements issues](#elements-issues).
2. Break it down to a minimal testcase where all used
   [Elements](#elements-issues) are [supported](/qmlweb/qmlweb/projects) but
   QmlWeb engine malfunctions. See [Core/Engine issues](#core-engine-issues).
3. See [Questions](#questions) for everything else. We can help with that,
   but GitHub issues is just not the right channel for that.

### Elements issues

Before filing an issue, check out the [Projects](/qmlweb/qmlweb/projects)
page and find that specific element to ensure that it is already implemented.

Please, do not file issues for individual unsupported elements (where the
implementation is not «Ready to use» yet), or elements where only a stub
implementation exists. Instead, consider writing a
[stub implementation](#writing-stubs), if it doesn't exist, or
[submit patches](#writing-actual-implementation) for elements that are not
ready yet.

Those are tracked in the QmlWeb [Projects](/qmlweb/qmlweb/projects) page.

If an element is labeled as «Ready to use» — build a minimal example to
demonstrate the issue that you are experiencing, ensure that your code works
with Qt QML, then file an issue with the code to reproduce it, describing the
differences to Qt QML behaviour that you observe. Submitting a
[failing test](#failing-tests) (if no similar already exists) would also be
helpful.

### Core/Engine issues

Submit an issue if it doesn't exist already.
Be sure to include a minimal reproducible testcase.

Parser errors should go into [qmlweb-parser](/qmlweb/qmlweb-parser) repository.

### Documentation/Testcases/Wishlist/other issues

Submit an issue if it doesn't exist already.

Note that «Wishlist» is not related to support stat of QML elements — those have
a [separate section](#elements-issues), but to everything else, e.g. QmlWeb API
requests, integration suggestions, and other things like that.

### Questions

Please, redirect questions to
[QmlWeb Gitter chat](https://gitter.im/qmlweb/qmlweb). It uses GitHub auth, so
should be available to everyone here without requiring additional registration.

## Fixing bugs

To fix a bug, provide a pull request, preferably with a
[testcase](#writing-tests).

Describe the changes in the commit message, see other commits in the repository
for examples. Describe why the change is desired (ideally — by including a
minimal reproducible testcase that it fixes).

If your pull request solves some [failing test](#failing-tests) — be sure to
mark it as non-failing (i.e. remove it from the
[failing tests list](/qmlweb/qmlweb/blob/master/tests/failingTests.js)).

Try to make sure `npm test` passes before submitting a pull request (that would
be also checked by CI for every pull request).

## Implementing elements

### Writing stubs

A stub for a QML element is just a class that lists its properties, their types,
signals, enums, and so on, but without implementation of the actual logic behind
the class.

You will likely easily find some examples of those in the source code.
If unsure, refer to the [Projects](/qmlweb/qmlweb/projects) page — projects
there have a separate status for stubs.

Contributing stubs is useful not only because it saves time later on when
writing the actual implementation, but also because it tells QmlWeb that that
element _exists_, so it won't bail out when user tries to instantiate it.

If the stub is for a regular QML element, add it to the list of
[initialization tests](#initialization-tests).
That will suffice as a testcase.

### Writing actual implementation

The goal is to support as much of the original Qt QML as possible, but even
small incremental steps to that goal are fine. If your code adds limited support
for an element or even implements some logic behind individual properties — be
sure to submit it!

Note that for elements existing in Qt QML, incompatible QmlWeb-only
functionality is not desired. So, please don't add any public properties or
hooks that are not present in the Qt counterpart of the said elements.
That is done to simplify maintaining compatibility in both directions.

Defining _new_ elements that are not present in Qt is fine though, as long as
they are placed in a separate module (preferably `QmlWeb.*`). Example:
[QmlWeb.Dom](/qmlweb/qmlweb/tree/master/src/modules/QmlWeb.Dom).

Testcases for the actual implementation are sometimes tricky.
If possible — create a [QtTest-based](#qttest-based-tests) testcase, and/or a
[render test](#render-tests).

## Writing tests

QmlWeb heavily relies on testcases, and those testcases are the best way to
ensure compatibility with Qt QML. Tests are split in several categories, see
below for more information.

_Please, do not submit thirdparty tests,_ submit only those that you have
written from scratch.

Failing tests that should work could also be submitted, by marking them as
failing in
[/tests/failingTests.js](/qmlweb/qmlweb/blob/master/tests/failingTests.js).

### QtTest-based tests

Automatic tests placed in [/tests/Auto](/qmlweb/qmlweb/tree/master/tests/Auto)
that could be run on both Qt QML and QmlWeb to ensure identical results.

This is the preferred way of defining all logic/method tests (i.e. all tests
except [Render tests](#render-tests)).

See [QtTest](https://doc.qt.io/qt-5.10/qttest-qmlmodule.html) documentation.

`npm run qmltestrunner` (or `qmltestrunner -input tests/Auto`) should pass on
the latest released Qt version.

### Render tests

Automatic render tests, each test consisting of a `*.qml` and a `*.png` file.
These tests are also runnable on both QmlWeb and Qt to ensure compatibility.

This is the preferred way of defining layout/positioning tests.

Things to note:

* Transparency is taken into account, if your testcase does not fill all the
  background — the png should include transparency for the test to pass.
* Some tests are not suitable to be a render test, as slight implementation
  differences are expected between various browsers (and even various
  Qt/os/platform versions). E.g. everything that includes text should probably
  not be a render test.
* Some color/opacity-rendering rounding implementation differs between browsers
  by 1 color step (1/255, 0.4%). Such tests should be placed in `Render/Fuzzy`
  directory.

Running these tests with `QMLWEB_SAVE_RENDER=1` would save the render output to
the `tmp/Render` directory. These could be used to quickly obtain the expected
output of a correctly performing testcase (given that it matches with Qt QML
rendering). It is also suggested to losslessly optimize the image before
commiting.

`npm run qmltestrunner` (or `qmltestrunner -input tests/Render`) should pass on
the latest released Qt version.

### Initialization tests

Initialization tests only check the presence of elements and the ability to
instantiate them. They are defined in a single list, in file
[/tests/Initialize/runner.js](/qmlweb/qmlweb/blob/master/tests/Initialize/runner.js).

Contribute initialization tests when writing [stubs](#writing-stubs) for new
elements, one line per each element that should support direct instantiation
from QML.

### Manual tests

In most cases, you don't need those, _unless_ you are fixing
[core/engine issues](#core-engine-issues).

See [QMLEngine tests](/qmlweb/qmlweb/tree/master/tests/QMLEngine) for examples.

If the same test could be implemented using [QtTest-based](#qttest-based-tests)
or [render](#render-tests) tests — use those instead.

### Failing tests

As the compatibility is not perfect yet, there is a known list of currently
failing tests. It is located in
[/tests/failingTests.js](/qmlweb/qmlweb/blob/master/tests/failingTests.js) file.

Submitting failing tests with issues is encouraged, those are needed to
reproduce the problem and to ensure it won't come back after being fixed.

If possible, submit a failing test each time you encounter an new issue that's
not already tested.

The overall recommendation is to keep those tests as simple as possible, though.
Complex tests are less likely to be accepted, try to make a _minimal_
reproducible testcase.

## Code maintenance and cleanup

Code maintenance and cleanup pull requests are accepted without appropriate
testcases. All the existing passing testcases should still pass (`npm test`).

Please provide an explanation why the change is desired, both in the commit
description and in the pull request text.

## Documentation

This is similar to [Fixing bugs](#fixing-bugs) in many aspects — just file an
issue or a pull request if you think there is room for specific improvement.

Note that QML language itself and QML elements that exist in Qt QML are not
documented here, the documentation for them resides upstream at
<https://doc.qt.io/>.

As markdown files are linted, `npm test` (or `npm run mdlint`) should pass.

_______

If you have any questions left after reading this document, feel free to ask
them in [QmlWeb Gitter chat](https://gitter.im/qmlweb/qmlweb).
