//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from "assert";
import * as myExtension from "../extension";
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
// import * as vscode from 'vscode';
// import * as myExtension from '../extension';

// Defines a Mocha test suite to group tests of similar kind together
suite("Extension Tests", function() {
    // Defines a Mocha unit test
    test("Something 1", function() {
        assert.equal(-1, [1, 2, 3].indexOf(5));
        assert.equal(-1, [1, 2, 3].indexOf(0));
    });

    test("Extract version from tring", function() {
        let input = "1.2.3";
        let expectedMajor = 1;
        let expectedMinor = 2;
        let expectedPatch = 3;

        let actual = myExtension.mapStringToRelease(input);
        assert.equal(actual.major, expectedMajor);
        assert.equal(actual.minor, expectedMinor);
        assert.equal(actual.patch, expectedPatch);
    });
});
