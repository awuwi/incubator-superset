/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import React from 'react';
import { mount, shallow } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { QueryParamProvider } from 'use-query-params';
import { supersetTheme, ThemeProvider } from '@superset-ui/style';

import ListView from 'src/components/ListView/ListView';
import ListViewFilters from 'src/components/ListView/Filters';
import ListViewPagination from 'src/components/ListView/Pagination';
import Pagination from 'src/components/Pagination';
import Button from 'src/components/Button';

import waitForComponentToPaint from 'spec/helpers/waitForComponentToPaint';
import IndeterminateCheckbox from 'src/components/IndeterminateCheckbox';

function makeMockLocation(query) {
  const queryStr = encodeURIComponent(query);
  return {
    protocol: 'http:',
    host: 'localhost',
    pathname: '/',
    search: queryStr.length ? `?${queryStr}` : '',
  };
}

const fetchSelectsMock = jest.fn(() => []);
const mockedProps = {
  title: 'Data Table',
  columns: [
    {
      accessor: 'id',
      Header: 'ID',
      sortable: true,
    },
    {
      accessor: 'age',
      Header: 'Age',
    },
    {
      accessor: 'name',
      Header: 'Name',
    },
  ],
  filters: [
    {
      Header: 'ID',
      id: 'id',
      input: 'select',
      selects: [{ label: 'foo', value: 'bar' }],
      operator: 'eq',
    },
    {
      Header: 'Name',
      id: 'name',
      input: 'search',
      operator: 'ct',
    },
    {
      Header: 'Age',
      id: 'age',
      input: 'select',
      fetchSelects: fetchSelectsMock,
      paginate: true,
      operator: 'eq',
    },
  ],
  data: [
    { id: 1, name: 'data 1' },
    { id: 2, name: 'data 2' },
  ],
  count: 2,
  pageSize: 1,
  fetchData: jest.fn(() => []),
  loading: false,
  bulkSelectEnabled: true,
  disableBulkSelect: jest.fn(),
  bulkActions: [
    {
      key: 'something',
      name: 'do something',
      style: 'danger',
      onSelect: jest.fn(),
    },
  ],
};

const factory = (props = mockedProps) =>
  mount(
    <QueryParamProvider location={makeMockLocation()}>
      <ListView {...props} />
    </QueryParamProvider>,
    {
      wrappingComponent: ThemeProvider,
      wrappingComponentProps: { theme: supersetTheme },
    },
  );

describe('ListView', () => {
  let wrapper = beforeAll(async () => {
    wrapper = factory();
    await waitForComponentToPaint(wrapper);
  });

  afterEach(() => {
    mockedProps.fetchData.mockClear();
    mockedProps.bulkActions.forEach(ba => {
      ba.onSelect.mockClear();
    });
  });

  it('calls fetchData on mount', () => {
    expect(wrapper.find(ListView)).toHaveLength(1);
    expect(mockedProps.fetchData.mock.calls[0]).toMatchInlineSnapshot(`
                                                      Array [
                                                        Object {
                                                          "filters": Array [],
                                                          "pageIndex": 0,
                                                          "pageSize": 1,
                                                          "sortBy": Array [],
                                                        },
                                                      ]
                                    `);
  });

  it('calls fetchData on sort', () => {
    wrapper.find('[data-test="sort-header"]').at(1).simulate('click');

    expect(mockedProps.fetchData).toHaveBeenCalled();
    expect(mockedProps.fetchData.mock.calls[0]).toMatchInlineSnapshot(`
                                                      Array [
                                                        Object {
                                                          "filters": Array [],
                                                          "pageIndex": 0,
                                                          "pageSize": 1,
                                                          "sortBy": Array [
                                                            Object {
                                                              "desc": false,
                                                              "id": "id",
                                                            },
                                                          ],
                                                        },
                                                      ]
                                    `);
  });

  it('renders pagination controls', () => {
    expect(wrapper.find(Pagination).exists()).toBe(true);
    expect(wrapper.find(Pagination.Prev).exists()).toBe(true);
    expect(wrapper.find(Pagination.Item).exists()).toBe(true);
    expect(wrapper.find(Pagination.Next).exists()).toBe(true);
  });

  it('calls fetchData on page change', () => {
    act(() => {
      wrapper.find(ListViewPagination).prop('onChange')(2);
    });
    wrapper.update();

    expect(mockedProps.fetchData.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        Object {
          "filters": Array [],
          "pageIndex": 1,
          "pageSize": 1,
          "sortBy": Array [
            Object {
              "desc": false,
              "id": "id",
            },
          ],
        },
      ]
    `);
  });

  it('handles bulk actions on 1 row', () => {
    act(() => {
      wrapper.find('input[id="0"]').at(0).prop('onChange')({
        target: { value: 'on' },
      });
    });
    wrapper.update();

    act(() => {
      wrapper
        .find('[data-test="bulk-select-controls"]')
        .find(Button)
        .props()
        .onClick();
    });

    expect(mockedProps.bulkActions[0].onSelect.mock.calls[0])
      .toMatchInlineSnapshot(`
                                    Array [
                                      Array [
                                        Object {
                                          "id": 1,
                                          "name": "data 1",
                                        },
                                      ],
                                    ]
                        `);
  });

  it('handles bulk actions on all rows', () => {
    act(() => {
      wrapper.find('input[id="header-toggle-all"]').at(0).prop('onChange')({
        target: { value: 'on' },
      });
    });
    wrapper.update();

    act(() => {
      wrapper
        .find('[data-test="bulk-select-controls"]')
        .find(Button)
        .props()
        .onClick();
    });

    expect(mockedProps.bulkActions[0].onSelect.mock.calls[0])
      .toMatchInlineSnapshot(`
                        Array [
                          Array [
                            Object {
                              "id": 1,
                              "name": "data 1",
                            },
                            Object {
                              "id": 2,
                              "name": "data 2",
                            },
                          ],
                        ]
                `);
  });

  it('allows deselecting all', async () => {
    act(() => {
      wrapper.find('[data-test="bulk-select-deselect-all"]').props().onClick();
    });
    await waitForComponentToPaint(wrapper);
    wrapper.update();
    wrapper.find(IndeterminateCheckbox).forEach(input => {
      expect(input.props().checked).toBe(false);
    });
  });

  it('allows disabling bulkSelect', () => {
    wrapper
      .find('[data-test="bulk-select-controls"]')
      .at(0)
      .props()
      .onDismiss();
    expect(mockedProps.disableBulkSelect).toHaveBeenCalled();
  });

  it('disables bulk select based on prop', async () => {
    const wrapper2 = factory({ ...mockedProps, bulkSelectEnabled: false });
    await waitForComponentToPaint(wrapper2);
    expect(wrapper2.find('[data-test="bulk-select-controls"]').exists()).toBe(
      false,
    );
  });

  it('Throws an exception if filter missing in columns', () => {
    expect.assertions(1);
    const props = {
      ...mockedProps,
      filters: [...mockedProps.filters, { id: 'some_column' }],
    };
    expect(() => {
      shallow(<ListView {...props} />, {
        wrappingComponent: ThemeProvider,
        wrappingComponentProps: { theme: supersetTheme },
      });
    }).toThrowErrorMatchingInlineSnapshot(
      '"Invalid filter config, some_column is not present in columns"',
    );
  });

  it('renders UI filters', () => {
    expect(wrapper.find(ListViewFilters)).toHaveLength(1);
  });

  it('calls fetchData on filter', () => {
    act(() => {
      wrapper
        .find('[data-test="filters-select"]')
        .first()
        .props()
        .onChange({ value: 'bar' });
    });

    act(() => {
      wrapper
        .find('[data-test="filters-search"]')
        .first()
        .props()
        .onChange({ currentTarget: { value: 'something' } });
    });

    wrapper.update();

    act(() => {
      wrapper.find('[data-test="search-input"]').last().props().onBlur();
    });

    expect(mockedProps.fetchData.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        Object {
          "filters": Array [
            Object {
              "id": "id",
              "operator": "eq",
              "value": "bar",
            },
          ],
          "pageIndex": 0,
          "pageSize": 1,
          "sortBy": Array [
            Object {
              "desc": false,
              "id": "id",
            },
          ],
        },
      ]
    `);

    expect(mockedProps.fetchData.mock.calls[1]).toMatchInlineSnapshot(`
      Array [
        Object {
          "filters": Array [
            Object {
              "id": "id",
              "operator": "eq",
              "value": "bar",
            },
            Object {
              "id": "name",
              "operator": "ct",
              "value": "something",
            },
          ],
          "pageIndex": 0,
          "pageSize": 1,
          "sortBy": Array [
            Object {
              "desc": false,
              "id": "id",
            },
          ],
        },
      ]
    `);
  });
});
