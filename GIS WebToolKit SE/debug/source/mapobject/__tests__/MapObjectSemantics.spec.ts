import 'jest';
import MapObjectSemantics from '../MapObjectSemantics';
import { FeatureSemanticItem } from '~/utils/GeoJSON';

describe( 'MapObjectSemantics', () => {

    let instance: MapObjectSemantics;
    const semantic: FeatureSemanticItem = { key: '1', value: 'val', name: 'Name' };
    const semantics: FeatureSemanticItem[] = [semantic, { key: '2', value: 'val2', name: 'Name2' },];

    beforeEach( () => {
        instance = new MapObjectSemantics();
    } );

    test( 'instance was created', () => {
        expect( instance ).toBeInstanceOf( MapObjectSemantics );
    } );

    test( 'returns undefined if no semantic', () => {
        expect( instance.getFirstSemantic( 'foo' ) ).toEqual( undefined );
    } );

    test( 'returns repeatable semantics array (by key)', () => {
        const setOne: FeatureSemanticItem[] = [
            { key: '1', value: '1', name: 'n1' },
            { key: '1', value: '2', name: 'n2' }
        ];
        instance.addUniqueSemantics( setOne );
        const semantics = instance.getRepeatableSemantics( setOne[ 0 ].key );
        expect( semantics ).toEqual( setOne );
    } );

    test( 'returns repeatable semantics array (by code)', () => {
        const setOne: FeatureSemanticItem[] = [
            { key: '1', value: '1', name: 'n1', code: 'code1' },
            { key: '2', value: '2', name: 'n2', code: 'code1' },
            { key: '3', value: '3', name: 'n3', code: 'code3' }
        ];
        instance.addUniqueSemantics( setOne );
        const semantics = instance.getRepeatableSemanticsByCode( setOne[ 0 ].code! );
        expect( semantics ).toEqual( [
            { key: '1', value: '1', name: 'n1', code: 'code1' },
            { key: '2', value: '2', name: 'n2', code: 'code1' }
        ] );
    } );

    test( 'adds one semantic', () => {
        instance.addUniqueSemantic( semantic );
        const result = instance.getFirstSemantic( semantic.key );
        expect( result ).toEqual( semantic );
        expect( result && result.key ).toEqual( semantic.key );
    } );

    describe( '#addSemantics()', () => {
        const setOne: FeatureSemanticItem[] = [
            { key: '1', value: '1', name: 'n1' },
            { key: '2', value: '2', name: 'n2' },
            { key: '2.1', value: '2', name: 'n2' }
        ];
        const instance = new MapObjectSemantics();
        instance.addUniqueSemantics( setOne );

        test.each( setOne )( 'semantic(%#)', ( { key, value, name } ) => {
            const semantic = instance.getFirstSemantic( key );
            expect( semantic && semantic.value === value && semantic.name === name ).toBeTruthy();
        } );
    } );

    test( 'updates semantic value', () => {
        const setOne: FeatureSemanticItem[] = [
            { key: '1', value: '1', name: 'n1' },
            { key: '2', value: '2', name: 'n2' }
        ];

        instance.addUniqueSemantics( setOne );
        instance.setFirstSemanticValue( setOne[ 0 ].key, 'new value' );
        const semantic = instance.getFirstSemantic( setOne[ 0 ].key );
        expect( semantic ).toEqual( { ...setOne[ 0 ], value: 'new value' } );
    } );

    test( 'updates repeatable semantic value', () => {
        const setOne: FeatureSemanticItem[] = [
            { key: '1', value: '1', name: 'n1' },
            { key: '1', value: '2', name: 'n2' }
        ];

        instance.addUniqueSemantics( setOne );
        instance.setRepeatableSemanticValues( setOne[ 0 ].key, ['new value'] );
        const semantics = instance.getRepeatableSemantics( setOne[ 0 ].key );
        expect( semantics[ 0 ] ).toEqual( { ...setOne[ 0 ], value: 'new value' } );
    } );

    test( 'returns semantic value', () => {
        instance.addUniqueSemantic( semantic );
        const result = instance.getUniqueSemanticValue( semantic.key );

        expect( result ).toEqual( semantic.value );
    } );

    test( 'returns repeatable semantic values (by key)', () => {
        const setOne: FeatureSemanticItem[] = [
            { key: '1', value: '1', name: 'n1' },
            { key: '1', value: '2', name: 'n2' },
            { key: '3', value: '3', name: 'n3' },
        ];

        instance.addUniqueSemantics( setOne );
        const result = instance.getRepeatableSemanticValues( setOne[ 0 ].key );
        expect( result ).toEqual( [setOne[ 0 ].value, setOne[ 1 ].value] );
    } );

    test( 'returns repeatable semantic values (by code)', () => {
        const setOne: FeatureSemanticItem[] = [
            { key: '1', value: '1', name: 'n1', code: 'code1' },
            { key: '2', value: '2', name: 'n2', code: 'code1' },
            { key: '3', value: '3', name: 'n3', code: 'code3' }
        ];

        instance.addUniqueSemantics( setOne );
        const result = instance.getRepeatableSemanticValuesByCode( setOne[ 0 ].code! );
        expect( result ).toEqual( [setOne[ 0 ].value, setOne[ 1 ].value] );
    } );

    test( 'returns semantic uniq keys', () => {
        const setOne: FeatureSemanticItem[] = [
            { key: '1', value: '1', name: 'n1', code: 'code1' },
            { key: '1', value: '2', name: 'n2', code: 'code2' },
            { key: '3', value: '3', name: 'n3', code: 'code3' }
        ];

        instance.addUniqueSemantics( setOne );
        const result = instance.getSemanticUniqKeys();
        expect( result ).toEqual( [setOne[ 0 ].key, setOne[ 2 ].key] );
    } );

    test( 'returns semantic uniq codes', () => {
        const setOne: FeatureSemanticItem[] = [
            { key: '1', value: '1', name: 'n1', code: 'code1' },
            { key: '2', value: '2', name: 'n2', code: 'code1' },
            { key: '3', value: '3', name: 'n3', code: 'code3' }
        ];

        instance.addUniqueSemantics( setOne );
        const result = instance.getSemanticUniqCodes();
        expect( result ).toEqual( [setOne[ 0 ].code, setOne[ 2 ].code] );
    } );

    test( 'removes semantic', () => {
        instance.addUniqueSemantic( semantic );
        instance.removeUniqueSemantic( semantic.key );
        expect( instance.getFirstSemantic( semantic.key ) ).toEqual( undefined );
    } );

    test( 'removes exact semantic (by key)', () => {
        const setOne: FeatureSemanticItem[] = [
            { key: '1', value: '1', name: 'n1', code: 'code1' },
            { key: '1', value: '2', name: 'n1', code: 'code1' },
            { key: '3', value: '3', name: 'n3', code: 'code3' }
        ];
        instance.addUniqueSemantics( setOne );
        instance.removeExactSemantic( setOne[ 1 ].key, setOne[ 1 ].value );
        expect( instance.getRepeatableSemantics( setOne[ 0 ].key ) ).toEqual( [setOne[ 0 ]] );
    } );

    test( 'removes exact semantic (by code)', () => {
        const setOne: FeatureSemanticItem[] = [
            { key: '1', value: '1', name: 'n1', code: 'code1' },
            { key: '3', value: '2', name: 'n3', code: 'code3' },
            { key: '3', value: '3', name: 'n3', code: 'code3' }
        ];
        instance.addUniqueSemantics( setOne );
        instance.removeExactSemanticByCode( setOne[ 1 ].code!, setOne[ 1 ].value );
        expect( instance.getRepeatableSemantics( setOne[ 2 ].key ) ).toEqual( [setOne[ 2 ]] );
    } );

    test( 'deletes all semantics after clearing', () => {
        const setOne: FeatureSemanticItem[] = [
            { key: '1', value: '1', name: 'n1' },
            { key: '2', value: '2', name: 'n2' },
            { key: '2.1', value: '2', name: 'n2' }
        ];
        instance.addUniqueSemantics( setOne );
        instance.clear();
        expect( instance.getSemanticUniqKeys() ).toEqual( [] );
    } );

    describe( '#equals()', () => {

        test( 'returns true if instances have equal semantics', () => {
            const setOne: FeatureSemanticItem[] = [{ key: '1', value: '1', name: 'n1' }, { key: '2', value: '2', name: 'n2' }];
            const setTwo: FeatureSemanticItem[] = [{ key: '1', value: '1', name: 'n1' }, { key: '2', value: '2', name: 'n2' }];
            const instance1 = new MapObjectSemantics();
            const instance2 = new MapObjectSemantics();

            instance1.addUniqueSemantics( setOne );
            instance2.addUniqueSemantics( setTwo );

            expect( instance1.equals( instance2 ) ).toEqual( true );
        } );

        test( 'returns true if instances have differences in semantic keys', () => {
            const setOne: FeatureSemanticItem[] = [{ key: '1', value: '1', name: 'n1' }, { key: '2', value: '2', name: 'n2' }];
            const setTwo: FeatureSemanticItem[] = [{ key: '1.1', value: '1', name: 'n1' }, { key: '2', value: '2', name: 'n2' }];
            const instance1 = new MapObjectSemantics();
            const instance2 = new MapObjectSemantics();

            instance1.addUniqueSemantics( setOne );
            instance2.addUniqueSemantics( setTwo );

            expect( instance1.equals( instance2 ) ).toEqual( false );
        } );

        test( 'returns true if instances have differences in semantic values', () => {
            const setOne: FeatureSemanticItem[] = [{ key: '1', value: '1', name: 'n1' }, { key: '2', value: '2', name: 'n2' }];
            const setTwo: FeatureSemanticItem[] = [{ key: '1', value: '1.2', name: 'n1' }, { key: '2', value: '2', name: 'n2' }];
            const instance1 = new MapObjectSemantics();
            const instance2 = new MapObjectSemantics();

            instance1.addUniqueSemantics( setOne );
            instance2.addUniqueSemantics( setTwo );

            expect( instance1.equals( instance2 ) ).toEqual( false );
        } );

        test( 'returns true if instances have differences in semantic names', () => {
            const setOne: FeatureSemanticItem[] = [{ key: '1', value: '1', name: 'n1' }, { key: '2', value: '2', name: 'n2' }];
            const setTwo: FeatureSemanticItem[] = [{ key: '1', value: '1', name: 'n1' }, { key: '2', value: '2', name: 'n21' }];
            const instance1 = new MapObjectSemantics();
            const instance2 = new MapObjectSemantics();

            instance1.addUniqueSemantics( setOne );
            instance2.addUniqueSemantics( setTwo );

            expect( instance1.equals( instance2 ) ).toEqual( false );
        } );

        test( 'returns true if instances have differences in size', () => {
            const setOne: FeatureSemanticItem[] = [
                { key: '1', value: '1', name: 'n1' },
                { key: '2', value: '2', name: 'n2' },
                { key: '2.1', value: '2', name: 'n2' }
            ];
            const setTwo: FeatureSemanticItem[] = [
                { key: '1', value: '1', name: 'n1' },
                { key: '2', value: '2', name: 'n2' }
            ];
            const instance1 = new MapObjectSemantics();
            const instance2 = new MapObjectSemantics();

            instance1.addUniqueSemantics( setOne );
            instance2.addUniqueSemantics( setTwo );

            expect( instance1.equals( instance2 ) ).toEqual( false );
        } );
    } );

    test( 'updates all data from other instance', () => {
        instance.addUniqueSemantics( semantics );

        const setOne: FeatureSemanticItem[] = [
            { key: 'u1', value: '1', name: 'n1' },
            { key: 'u2', value: '2', name: 'n2' },
            { key: 'u2.1', value: '2', name: 'n2' }
        ];
        const instance1 = new MapObjectSemantics();
        instance1.addUniqueSemantics( setOne );
        instance.updateFrom( instance1 );
        expect( instance.equals( instance1 ) ).toEqual( true );
    } );

    test( 'returns serialized form (JSON)', () => {
        instance.addUniqueSemantics( semantics );

        const result = instance.toJSON();

        expect( result ).toEqual( { semantics } );
    } );
} );
