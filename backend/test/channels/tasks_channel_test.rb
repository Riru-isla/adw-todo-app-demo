require "test_helper"

class TasksChannelTest < ActionCable::Channel::TestCase
  test "subscribes and streams from tasks" do
    subscribe
    assert subscription.confirmed?
    assert_has_stream "tasks"
  end

  test "unsubscribes and stops streams" do
    subscribe
    unsubscribe
    assert_no_streams
  end
end
